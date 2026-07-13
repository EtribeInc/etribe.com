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
            var res = await fetch(p2pTurnCredentialsUrl, { signal: controller.signal });
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
            onJoinError: function (details) {
                console.error('[p2p] peer join error', details);
            }
        });
        P2P.selfId = Trystero.selfId;
        P2P.isReady = true;
        P2P._resolve(P2P.room);
        console.log('[p2p] joined room ' + P2P.code + ' as ' + P2P.selfId);
    }

    boot().catch(function (err) {
        P2P.error = err;
        P2P._reject(err);
        console.error('[p2p] bootstrap failed', err);
    });
})();
