/*jshint esversion: 9 */

/*
 * P2P bootstrap: joins the Trystero room once at script-asset load time,
 * before any scene loads, and survives the airlock -> main scene swap.
 *
 * Loading order requirement (PlayCanvas editor settings):
 *   constants.js -> trystero-nostr-<ver>.iife.js -> p2pBootstrap.js -> everything else
 *
 * Exposes window.TellyP2P:
 *   ready   - Promise resolving to the Trystero room (primary gate for consumers)
 *   room    - the Trystero room (null until ready)
 *   selfId  - the local peer id (null until ready)
 *   code    - the canonical room code, e.g. "7XK4-M2P9"
 *   isReady - boolean convenience flag
 *   error   - the bootstrap error, if joining failed
 */
(function () {
    var P2P = window.TellyP2P = {
        room: null,
        selfId: null,
        code: null,
        error: null,
        isReady: false
    };
    P2P.ready = new Promise(function (resolve, reject) {
        P2P._resolve = resolve;
        P2P._reject = reject;
    });

    // Crockford base32: no I, L, O, U - codes survive being read out loud
    var ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    var CODE_LENGTH = 8;

    function generateCode() {
        var bytes = new Uint8Array(CODE_LENGTH);
        crypto.getRandomValues(bytes);
        var code = '';
        for (var i = 0; i < CODE_LENGTH; i++) {
            code += ALPHABET[bytes[i] % 32];
        }
        return code;
    }

    function normalizeCode(raw) {
        return (raw || '')
            .toUpperCase()
            .replace(/[^0-9A-Z]/g, '')
            .replace(/[IL]/g, '1')
            .replace(/O/g, '0')
            .replace(/U/g, 'V');
    }

    function displayCode(norm) {
        return norm.slice(0, 4) + '-' + norm.slice(4);
    }

    async function sha256Hex(str) {
        var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
        return Array.from(new Uint8Array(buf))
            .map(function (b) { return b.toString(16).padStart(2, '0'); })
            .join('');
    }

    async function getTrystero() {
        if (window.Trystero) return window.Trystero;
        console.warn('[p2p] vendored Trystero bundle missing, falling back to CDN');
        return import('https://cdn.jsdelivr.net/npm/trystero@0.25.2/nostr/+esm');
    }

    // Fetch short-lived ICE servers (STUN + TURN) from our coturn auth
    // endpoint. Returns the iceServers array, or null on any failure so the
    // caller can fall back to STUN-only. A timeout guards against a hung
    // endpoint blocking room join indefinitely.
    async function fetchIceServers() {
        if (!p2pTurnCredentialsUrl) return null;
        var controller = new AbortController();
        var timer = setTimeout(function () { controller.abort(); }, P2P_TURN_FETCH_TIMEOUT_MS);
        try {
            // Unique per-session user id: without it the endpoint mints
            // username = expiry timestamp, so clients fetching in the same
            // second share one username - and coturn's user-quota counts
            // allocations per username, not per client.
            var uid = Array.from(crypto.getRandomValues(new Uint8Array(6)),
                function (b) { return b.toString(16).padStart(2, '0'); }).join('');
            var url = p2pTurnCredentialsUrl +
                (p2pTurnCredentialsUrl.indexOf('?') === -1 ? '?u=' : '&u=') + uid;
            var res = await fetch(url, { signal: controller.signal });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            var body = await res.json();
            var servers = body && body.iceServers;
            if (!Array.isArray(servers) || servers.length === 0) {
                throw new Error('response had no iceServers array');
            }
            console.log('[p2p] fetched ' + servers.length + ' ICE server entries from auth endpoint');
            return servers;
        } catch (err) {
            console.warn('[p2p] TURN credential fetch failed, falling back to STUN only', err);
            return null;
        } finally {
            clearTimeout(timer);
        }
    }

    // --- connection diagnostics ---

    // Fall back to defaults if the deployed constants.js predates these
    // tunables - diagnostics must never break the bootstrap.
    var JOIN_ERROR_GRACE_MS = typeof P2P_JOIN_ERROR_GRACE_MS !== 'undefined' ? P2P_JOIN_ERROR_GRACE_MS : 45000;
    var PEER_WATCH_MS = typeof P2P_PEER_WATCH_MS !== 'undefined' ? P2P_PEER_WATCH_MS : 3000;

    function getRoomPeers() {
        if (!P2P.room) return {};
        try { return P2P.room.getPeers(); } catch (err) { return {}; }
    }

    // Human-readable summary of the ICE route a connection settled on,
    // e.g. "local relay <-> remote srflx (TURN relayed)". This is the fact
    // that matters when a mesh pair fails: relay<->relay pairs exercise
    // coturn allocation-to-allocation forwarding, direct pairs never touch
    // TURN at all.
    async function describeIceRoute(pc) {
        try {
            var byId = {};
            var pair = null;
            var stats = await pc.getStats();
            stats.forEach(function (r) { byId[r.id] = r; });
            stats.forEach(function (r) {
                if (r.type === 'transport' && r.selectedCandidatePairId) {
                    pair = byId[r.selectedCandidatePairId];
                }
            });
            if (!pair) {
                // Firefox: no transport stats, fall back to the nominated pair
                stats.forEach(function (r) {
                    if (r.type === 'candidate-pair' && r.state === 'succeeded' && r.nominated) {
                        pair = r;
                    }
                });
            }
            // What this client managed to gather: srflx proves STUN reached
            // coturn, relay proves a TURN allocation succeeded - regardless
            // of which pair ultimately won the race.
            var counts = {};
            stats.forEach(function (r) {
                if (r.type === 'local-candidate') {
                    counts[r.candidateType] = (counts[r.candidateType] || 0) + 1;
                }
            });
            var gathered = Object.keys(counts).map(function (t) {
                return t + ' x' + counts[t];
            }).join(', ') || 'none recorded';

            if (!pair) {
                return 'no selected candidate pair yet (' + pc.connectionState +
                    '); gathered: ' + gathered;
            }
            var local = byId[pair.localCandidateId] || {};
            var remote = byId[pair.remoteCandidateId] || {};
            var relayed = local.candidateType === 'relay' || remote.candidateType === 'relay';
            return 'local ' + (local.candidateType || '?') +
                ' <-> remote ' + (remote.candidateType || '?') +
                (relayed ? ' (TURN relayed)' : ' (direct)') +
                '; gathered: ' + gathered;
        } catch (err) {
            return 'stats unavailable (' + err.message + ')';
        }
    }

    // Console helper for live debugging: TellyP2P.debugPeers()
    P2P.debugPeers = function () {
        var peers = getRoomPeers();
        var ids = Object.keys(peers);
        console.log('[p2p] self ' + P2P.selfId + ', ' + ids.length + ' connected peer(s)');
        ids.forEach(function (id) {
            describeIceRoute(peers[id]).then(function (route) {
                console.log('[p2p]   ' + id + ': ' + peers[id].connectionState + ', ' + route);
            });
        });
    };

    // --- join-error grace period ---
    // Trystero fires onJoinError for every attempt that dies after SDP
    // exchange, but it keeps retrying; most of these resolve themselves.
    var pendingJoinErrors = {};   // peerId -> timeout handle

    function onJoinError(details) {
        var peerId = details.peerId;
        var isRetryable = typeof details.error === 'string' &&
            details.error.indexOf('could not connect to peer') === 0;

        // Non-retryable errors (wrong password = wrong room code, handshake
        // rejection) surface immediately.
        if (!peerId || !isRetryable) {
            console.error('[p2p] peer join error', details);
            return;
        }
        if (pendingJoinErrors[peerId]) return;

        console.log('[p2p] connection attempt to ' + peerId + ' failed, waiting for retry');
        pendingJoinErrors[peerId] = setTimeout(function () {
            delete pendingJoinErrors[peerId];
            if (getRoomPeers()[peerId]) return; // a retry made it after all
            console.error('[p2p] peer never connected within ' +
                (JOIN_ERROR_GRACE_MS / 1000) + 's grace period', details);
            P2P.debugPeers();
        }, JOIN_ERROR_GRACE_MS);
    }

    // --- mesh watcher ---
    // Logs every peer connect with its ICE route and every disconnect, and
    // clears pending join errors once the peer actually makes it in. Poll
    // based because Trystero room event handlers are single-assignment
    // properties owned by networking.js.
    var knownPeers = {};

    function watchMesh() {
        setInterval(function () {
            var peers = getRoomPeers();
            var ids = Object.keys(peers);

            ids.forEach(function (id) {
                if (knownPeers[id]) return;
                knownPeers[id] = true;
                if (pendingJoinErrors[id]) {
                    clearTimeout(pendingJoinErrors[id]);
                    delete pendingJoinErrors[id];
                    console.log('[p2p] retry to ' + id + ' succeeded');
                }
                describeIceRoute(peers[id]).then(function (route) {
                    console.log('[p2p] connected to ' + id + ' (' + route + '), mesh size ' + Object.keys(getRoomPeers()).length);
                });
            });

            Object.keys(knownPeers).forEach(function (id) {
                if (ids.indexOf(id) === -1) {
                    delete knownPeers[id];
                    console.log('[p2p] peer ' + id + ' disconnected, mesh size ' + ids.length);
                }
            });
        }, PEER_WATCH_MS);
    }

    async function boot() {
        var norm = normalizeCode(getURLParameter(ROOM_PARAM));
        if (norm.length !== CODE_LENGTH) norm = generateCode();
        P2P.code = displayCode(norm);
        // persist in the URL so refresh / copy-link keeps the room
        setURLParameter(ROOM_PARAM, P2P.code);

        // The code is the secret: the relays only ever see a hash of it, and
        // signaling is additionally encrypted with a key derived from it.
        // Different salt labels give domain separation between the two.
        var roomId = (await sha256Hex('tellyclub-room-v1:' + norm)).slice(0, 24);
        var password = await sha256Hex('tellyclub-pass-v1:' + norm);

        // Fetch TURN credentials in parallel with loading the Trystero
        // bundle - neither depends on the other.
        var results = await Promise.all([getTrystero(), fetchIceServers()]);
        var Trystero = results[0];
        var iceServers = results[1];

        var config = { appId: p2pAppId, password: password };
        // bundle ICE candidates with the SDP instead of trickling them as
        // separate relay messages - public nostr relays can drop trickled
        // candidates, which fails connections even between local tabs
        config.trickleIce = false;
        // Fetched credentials win; static p2pTurnConfig is the fallback.
        // Trystero merges whichever we pass with its default STUN servers.
        var turnConfig = iceServers || p2pTurnConfig;
        if (turnConfig) config.turnConfig = turnConfig;
        if (p2pRelayConfig) config.relayConfig = p2pRelayConfig;
        if (p2pRtcConfig) config.rtcConfig = p2pRtcConfig;

        P2P.room = Trystero.joinRoom(config, roomId, {
            onJoinError: onJoinError
        });
        P2P.selfId = Trystero.selfId;
        P2P.isReady = true;
        P2P._resolve(P2P.room);
        watchMesh();
        console.log('[p2p] joined room ' + P2P.code + ' as ' + P2P.selfId);
    }

    boot().catch(function (err) {
        P2P.error = err;
        P2P._reject(err);
        console.error('[p2p] bootstrap failed', err);
    });
})();
