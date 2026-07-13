/*jshint esversion: 9 */

/*
 * P2P game-state networking over a Trystero WebRTC mesh.
 *
 * Replaces the old Socket.IO client. There is no server: peers exchange a
 * `hello` snapshot when they meet, every peer is authoritative over its own
 * avatar, object ownership is arbitrated with Lamport clocks, and meeting
 * spot indices are derived deterministically from the sorted member list.
 *
 * Public surface preserved from the Socket.IO version: Networking.instance,
 * Networking.id, SendStateUpdate, getPlayers, claimObject, addObject,
 * assignVideoMaterial, assignRemoteAudio, requestScreenShare, joinMeeting,
 * leaveMeeting, the "playersChanged" entity event and the "meeting:indexChange"
 * app event.
 *
 * New app events for the media layer:
 *   'p2p:ready'                    - room connected, actions registered
 *   'p2p:peerJoin'   (peerId)      - fired AFTER the player entity exists
 *   'p2p:peerLeave'  (peerId)      - fired before the delayed entity destroy
 *   'p2p:peerStream' (stream, peerId, metadata)
 */

var Networking = pc.createScript('networking');

Networking.attributes.add('player', {
    type: 'entity',
    name: "Player Entity"
});

Networking.attributes.add('playerSpawnerEntity', {
    type: 'entity',
    name: "PlayerSpawner Entity"
});

Networking.instance = null;
Networking.id = null;

Networking.networkedObjects = {};

function netLerpAngle(a, b, t) {
    var d = ((b - a + 540) % 360) - 180;
    return a + d * t;
}

// initialize code called once per entity
Networking.prototype.initialize = function () {
    Networking.instance = this;

    this.playerSpawner = this.playerSpawnerEntity.script.get("playerSpawner");

    this.players = {};
    this.admin = false;               // no trust anchor without a server
    this.initialized = false;

    this.lamport = 0;
    this.meetings = new Map();        // meetId -> Set(peerId)
    this.myMeetings = new Set();
    this.objOwners = {};              // uid -> { owner, clock }
    this.shares = {};                 // shareId -> peerId
    this.pendingShare = null;
    this.pendingRemovals = {};
    this.greeted = {};                // peerId -> we sent our hello
    this.helloReceived = {};          // peerId -> we got their hello
    this.localAnim = {};

    this.actions = {};
    this.poseAccum = 0;
    this.lastPose = null;
    this.lastPoseTime = 0;

    this.model = getURLParameter("char") ? parseInt(getURLParameter("char")) : 0;
    this.username = "user";

    this.app.on("networking:joinMeeting", this.joinMeeting, this);
    this.app.on("networking:leaveMeeting", this.leaveMeeting, this);

    this.entity.on("admin:kick", () => {
        console.warn("Kick is not available in P2P rooms.");
    });

    this.on("destroy", () => {
        this.app.off("networking:joinMeeting", this.joinMeeting, this);
        this.app.off("networking:leaveMeeting", this.leaveMeeting, this);
        if (this.room) {
            this.room.onPeerJoin = null;
            this.room.onPeerLeave = null;
            this.room.onPeerStream = null;
        }
    });

    if (window.TellyP2P) {
        // the catch handles bootstrap failures only - errors thrown inside
        // connect() should surface as normal uncaught errors, not this alert
        TellyP2P.ready.catch((err) => {
            console.error("P2P bootstrap failed, no connection possible.", err);
            alert("Could not connect to the room. Please check your connection and reload.");
            return null;
        }).then((room) => {
            if (room) this.connect(room);
        });
    } else {
        console.error("TellyP2P bootstrap missing - check script loading order (p2pBootstrap.js must load before scenes).");
    }
};

Networking.prototype.connect = function (room) {
    this.room = room;
    this.id = TellyP2P.selfId;
    Networking.id = this.id;
    this.joinedAt = Date.now();

    this.players[this.id] = {
        id: this.id,
        username: this.username,
        model: this.model,
        self: true
    };

    // --- action handlers ---
    this.onAction('hello', (data, peerId) => this.onHello(data, peerId));
    this.onAction('pose', (data, peerId) => this.onPose(data, peerId));
    this.onAction('anim', (data, peerId) => this.changeState(data, peerId));
    this.onAction('objpose', (data, peerId) => this.onObjectUpdate(data, peerId));
    this.onAction('oclaim', (data, peerId) => {
        this.lamport = Math.max(this.lamport, data.c);
        this.applyClaim(data.u, data.c, peerId);
    });
    this.onAction('meet', (data, peerId) => this.applyMeet(data.m, data.in, peerId));
    this.onAction('share', (data, peerId) => this.onShareChanged(data, peerId));
    this.onAction('shrreq', (data, peerId) => this.onShareRequest(data, peerId));
    this.onAction('shrans', (data, peerId) => this.onShareAnswer(data, peerId));

    // --- peer lifecycle ---
    // Assigning onPeerJoin replays peers that are already in the mesh, which
    // covers the time this script spent in the airlock scene.
    room.onPeerJoin = (peerId) => this.greet(peerId);
    room.onPeerLeave = (peerId) => this.onPeerLeave(peerId);
    room.onPeerStream = (stream, peerId, metadata) => {
        this.app.fire("p2p:peerStream", stream, peerId, metadata);
    };

    this.initialized = true;
    console.log("P2P networking connected as " + this.id);

    // initialize video service (credential-free now)
    this.entity.script.videoController.connectToVideoService();

    this.entity.fire("playersChanged", this.players, this.admin);
    this.app.fire("p2p:ready");
};

// --- generic action API (also used by the media layer) ---

Networking.prototype.action = function (name) {
    if (!this.actions[name]) {
        var act = this.room.makeAction(name);
        var listeners = [];
        act.onMessage = (data, meta) => {
            for (var i = 0; i < listeners.length; i++) {
                listeners[i](data, meta.peerId);
            }
        };
        this.actions[name] = { act: act, listeners: listeners };
    }
    return this.actions[name];
};

Networking.prototype.sendAction = function (name, data, targetPeerId) {
    if (!this.room) return;
    var options = targetPeerId ? { target: targetPeerId } : undefined;
    this.action(name).act.send(data, options).catch((err) => {
        console.warn("P2P send failed for action '" + name + "'", err);
    });
};

Networking.prototype.onAction = function (name, callback) {
    this.action(name).listeners.push(callback);
};

// --- hello handshake / late-joiner sync ---

Networking.prototype.buildSnapshot = function () {
    var pos = this.player.getPosition();
    var rot = this.player.getEulerAngles();
    var owned = [];
    for (var u in this.objOwners) {
        if (this.objOwners[u].owner === this.id) {
            owned.push([u, this.objOwners[u].clock]);
        }
    }
    var share = null;
    for (var s in this.shares) {
        if (this.shares[s] === this.id) share = s;
    }
    return {
        v: 1,
        name: this.username,
        model: this.model,
        pos: [pos.x, pos.y, pos.z],
        rot: [rot.x, rot.y, rot.z],
        anim: this.localAnim,
        meets: Array.from(this.myMeetings),
        owned: owned,
        share: share,
        env: this.app.environment || null,
        ts: this.joinedAt
    };
};

Networking.prototype.greet = function (peerId) {
    this.greeted[peerId] = true;
    this.sendAction('hello', this.buildSnapshot(), peerId);
};

Networking.prototype.onHello = function (data, peerId) {
    var firstHello = !this.helloReceived[peerId];
    this.helloReceived[peerId] = true;

    // They joined after us -> genuinely new player (entrance animation).
    // They were here first -> roster fill, no entrance animation.
    var isAdd = data.ts >= this.joinedAt;

    this.addPlayer({
        id: peerId,
        username: data.name,
        model: data.model,
        pos: data.pos,
        rot: data.rot,
        state: data.anim ? data.anim[animLayers.BASE] : undefined
    }, isAdd);

    if (data.anim) {
        var entity = this.players[peerId].entity;
        var handler = entity && entity.script.get('modelHandler');
        if (handler) {
            for (var layer in data.anim) {
                handler.updateAnimation(parseInt(layer), data.anim[layer]);
            }
        }
    }

    (data.meets || []).forEach((meetId) => this.applyMeet(meetId, true, peerId));
    (data.owned || []).forEach(([uid, clock]) => {
        this.lamport = Math.max(this.lamport, clock);
        this.applyClaim(uid, clock, peerId);
    });
    if (data.share) this.shares[data.share] = peerId;

    if (data.env && this.app.environment && data.env !== this.app.environment) {
        console.warn("Environment mismatch with peer " + peerId + " (theirs: " + data.env + ", ours: " + this.app.environment + ")");
    }

    // Reply to the first hello even if we already greeted on onPeerJoin: our
    // earlier greeting may have arrived while the peer was still in the
    // airlock with no handlers registered.
    if (firstHello) this.greet(peerId);
};

// --- players ---

Networking.prototype.addPlayer = function (data, isAdd) {
    var id = data.id;

    if (this.pendingRemovals[id]) {
        clearTimeout(this.pendingRemovals[id]);
        delete this.pendingRemovals[id];
    }

    var existing = this.players[id];
    if (existing && existing.entity) {
        // duplicate hello or blip-reconnect: refresh instead of double-spawning
        existing.username = data.username;
        existing.entity.setPosition(data.pos[0], data.pos[1], data.pos[2]);
        existing.entity.setEulerAngles(data.rot[0], data.rot[1], data.rot[2]);
        var tag = existing.entity.findByTag("PlayerTag");
        if (tag && tag[0]) tag[0].script.text.setText(data.username);
        this.entity.fire("playersChanged", this.players, this.admin);
        this.app.fire("p2p:peerJoin", id);
        return existing.entity;
    }

    this.players[id] = data;
    this.players[id].buf = [];
    var entity = this.createPlayerEntity(data, isAdd);
    this.players[id].entity = entity;

    this.entity.fire("playersChanged", this.players, this.admin);
    if (isAdd) this.entity.fire("networking:playerJoined");

    // media layer hook: the player entity now exists
    this.app.fire("p2p:peerJoin", id);

    return entity;
};

Networking.prototype.createPlayerEntity = function (data, isAdd) {
    var newPlayer = this.playerSpawner.spawn(data.model, isAdd);

    if (data.pos) newPlayer.setPosition(data.pos[0], data.pos[1], data.pos[2]);
    if (data.rot) newPlayer.setEulerAngles(data.rot[0], data.rot[1], data.rot[2]);
    if (data.state !== undefined) {
        newPlayer.script.get('modelHandler').updateAnimation(animLayers.BASE, data.state);
    }
    var playerTag = newPlayer.findByTag("PlayerTag");
    if (playerTag != undefined && playerTag[0]) {
        playerTag[0].script.text.setText(data.username);
    }

    return newPlayer;
};

Networking.prototype.changeState = function (data, peerId) {
    if (this.initialized && this.players[peerId] && this.players[peerId].entity) {
        this.players[peerId].entity.script.get('modelHandler').updateAnimation(data.l, data.s);
    }
};

Networking.prototype.onPeerLeave = function (peerId) {
    delete this.greeted[peerId];
    delete this.helloReceived[peerId];

    // meetings: re-space the survivors
    this.meetings.forEach((memberSet, meetId) => {
        if (memberSet.delete(peerId)) this.recomputeMeeting(meetId);
    });

    // objects: release ownership, physics coasts until the next claim
    for (var u in this.objOwners) {
        if (this.objOwners[u].owner === peerId) {
            delete this.objOwners[u];
            var obj = Networking.networkedObjects[u];
            if (obj) obj.fire('networkedObjectOwner', null);
        }
    }

    // screen shares held by the departed peer
    for (var s in this.shares) {
        if (this.shares[s] === peerId) {
            delete this.shares[s];
            this.app.fire("screen:unpublished", s);
        }
    }

    this.app.fire("p2p:peerLeave", peerId);
    this.removePlayer(peerId);
};

Networking.prototype.removePlayer = function (id) {
    var player = this.players[id];
    if (player && player.entity) {
        player.entity.script.modelHandler.updateAnimation(animLayers.BASE, baselayerAnimStates.EXIT);
        this.pendingRemovals[id] = setTimeout(() => {
            delete this.pendingRemovals[id];
            if (this.players[id] && this.players[id].entity) {
                this.players[id].entity.destroy();
            }
            delete this.players[id];
            this.entity.fire("playersChanged", this.players, this.admin);
        }, 4000);
    } else {
        delete this.players[id];
        this.entity.fire("playersChanged", this.players, this.admin);
    }
};

Networking.prototype.SendStateUpdate = function (layer, state) {
    this.localAnim[layer] = state;
    if (this.initialized) {
        this.sendAction('anim', { l: layer, s: state }, null);
    }
};

Networking.prototype.getPlayers = function () {
    return this.players;
};

// --- position sync: fixed-rate send, interpolated receive ---

Networking.prototype.onPose = function (data, peerId) {
    var player = this.players[peerId];
    if (!this.initialized || !player || player.self || !player.entity) return;
    if (!player.buf) player.buf = [];
    player.buf.push({ t: performance.now(), d: data });
    if (player.buf.length > 20) player.buf.shift();
};

Networking.prototype.update = function (dt) {
    if (!this.initialized) return;

    this.updatePoseSend(dt);

    var renderT = performance.now() - P2P_INTERP_MS;
    for (var id in this.players) {
        var player = this.players[id];
        if (player.self || !player.entity || !player.buf || player.buf.length === 0) continue;

        var buf = player.buf;
        while (buf.length >= 2 && buf[1].t <= renderT) buf.shift();

        var s;
        if (buf.length >= 2 && buf[0].t <= renderT) {
            var a = buf[0], b = buf[1];
            var k = (renderT - a.t) / (b.t - a.t);
            k = k < 0 ? 0 : (k > 1 ? 1 : k);
            s = [
                a.d[0] + (b.d[0] - a.d[0]) * k,
                a.d[1] + (b.d[1] - a.d[1]) * k,
                a.d[2] + (b.d[2] - a.d[2]) * k,
                netLerpAngle(a.d[3], b.d[3], k),
                netLerpAngle(a.d[4], b.d[4], k),
                netLerpAngle(a.d[5], b.d[5], k)
            ];
        } else {
            // not enough history yet (or stream stalled): clamp to newest
            s = buf[buf.length - 1].d;
        }
        player.entity.setPosition(s[0], s[1], s[2]);
        player.entity.setEulerAngles(s[3], s[4], s[5]);
    }
};

Networking.prototype.updatePoseSend = function (dt) {
    this.poseAccum += dt;
    var interval = 1 / P2P_POSE_HZ;
    if (this.poseAccum < interval) return;
    this.poseAccum %= interval;

    var pos = this.player.getPosition();
    var rot = this.player.getEulerAngles();
    var d = [pos.x, pos.y, pos.z, rot.x, rot.y, rot.z];
    for (var i = 0; i < 6; i++) d[i] = Math.round(d[i] * 1000) / 1000;

    var now = performance.now();
    var moved = !this.lastPose;
    if (!moved) {
        for (i = 0; i < 6; i++) {
            if (d[i] !== this.lastPose[i]) { moved = true; break; }
        }
    }
    if (moved || now - this.lastPoseTime > P2P_KEEPALIVE_MS) {
        this.sendAction('pose', d, null);
        this.lastPose = d;
        this.lastPoseTime = now;
    }
};

// --- media material/audio assignment (called by the video layer) ---

Networking.prototype.assignVideoMaterial = function (uid, material) {
    if (!this.players[uid])
        return;
    var entity = this.players[uid].entity;
    if (entity) {
        entity.script.get('modelHandler').updateVideoMaterial(material);
    }
};

Networking.prototype.assignRemoteAudio = function (uid, stream) {
    if (!this.players[uid])
        return;
    var entity = this.players[uid].entity;
    if (entity) {
        entity.script.get('remoteAudio').assignRemoteAudio(stream);
    }
};

// --- meetings: deterministic index/count, no server ---

Networking.prototype.applyMeet = function (meetId, joined, peerId) {
    var memberSet = this.meetings.get(meetId) || new Set();
    if (joined) memberSet.add(peerId);
    else memberSet.delete(peerId);
    this.meetings.set(meetId, memberSet);
    this.recomputeMeeting(meetId);
};

Networking.prototype.recomputeMeeting = function (meetId) {
    var memberSet = this.meetings.get(meetId);
    // Only members reposition themselves (matches the server's member-only
    // updatedMeetingIndex delivery).
    if (!memberSet || !memberSet.has(this.id)) return;
    var members = Array.from(memberSet).sort();
    this.app.fire("meeting:indexChange", meetId, members.indexOf(this.id), members.length);
};

Networking.prototype.joinMeeting = function (meetId, callback) {
    if (!this.initialized) return;
    this.myMeetings.add(meetId);
    var memberSet = this.meetings.get(meetId) || new Set();
    memberSet.add(this.id);
    this.meetings.set(meetId, memberSet);
    this.sendAction('meet', { m: meetId, in: true }, null);

    var members = Array.from(memberSet).sort();
    callback({ index: members.indexOf(this.id), count: members.length });
    this.recomputeMeeting(meetId);
};

Networking.prototype.leaveMeeting = function (meetId) {
    if (!this.initialized) return;
    this.myMeetings.delete(meetId);
    this.applyMeet(meetId, false, this.id);
    this.sendAction('meet', { m: meetId, in: false }, null);
};

// --- screen share registry & takeover arbitration (holder veto) ---

Networking.prototype.requestScreenShare = function (shareId, callback) {
    if (!this.initialized) {
        callback("Not connected yet.");
        return;
    }
    var holder = this.shares[shareId];
    if (!holder || holder === this.id) {
        callback(null, { shareId: shareId });
        return;
    }
    if (this.pendingShare) {
        callback("A share request is already pending.");
        return;
    }
    this.pendingShare = {
        shareId: shareId,
        callback: callback,
        timer: setTimeout(() => {
            this.pendingShare = null;
            callback("No response from current presenter.");
        }, 15000)
    };
    this.sendAction('shrreq', { s: shareId }, holder);
};

// The video layer calls this when a share actually starts/stops publishing.
Networking.prototype.announceShare = function (shareId, on) {
    if (on) this.shares[shareId] = this.id;
    else if (this.shares[shareId] === this.id) delete this.shares[shareId];
    this.sendAction('share', { s: shareId, on: on }, null);
};

Networking.prototype.onShareChanged = function (data, peerId) {
    if (data.on) {
        this.shares[data.s] = peerId;
    } else if (this.shares[data.s] === peerId) {
        delete this.shares[data.s];
        this.app.fire("screen:unpublished", data.s);
    }
};

Networking.prototype.onShareRequest = function (data, peerId) {
    if (this.shares[data.s] !== this.id) {
        // we are not (or no longer) the holder - let the requester proceed
        this.sendAction('shrans', { s: data.s, ok: true }, peerId);
        return;
    }

    var panel = document.getElementById("tc-screen-sharing");
    panel.replaceWith(panel = panel.cloneNode(true));
    panel.classList.remove('tc-visible');
    panel.getElementsByClassName("tc-screen-sharing-title").item(1).innerHTML =
        (this.players[peerId] ? this.players[peerId].username : "Unknown user") +
        " would like to replace your shared screen. Is this ok?";
    panel.querySelector(".tc-screen-sharing-title").innerHTML = "Stop Sharing?";

    var yes = (e) => {
        e.stopPropagation();
        VideoInterface.instance.fire("screen:stopShare");
        this.sendAction('shrans', { s: data.s, ok: true }, peerId);
        panel.classList.add('tc-visible');
    };
    var no = (e) => {
        e.stopPropagation();
        panel.classList.add('tc-visible');
        this.sendAction('shrans', { s: data.s, ok: false }, peerId);
    };

    panel.querySelector("#tc-screen-sharing-btn-left").addEventListener("click", no);
    panel.querySelector("#tc-screen-sharing-btn-right").addEventListener("click", yes);
};

Networking.prototype.onShareAnswer = function (data, peerId) {
    if (!this.pendingShare || this.pendingShare.shareId !== data.s) return;
    var pending = this.pendingShare;
    this.pendingShare = null;
    clearTimeout(pending.timer);
    if (data.ok) {
        pending.callback(null, { shareId: data.s });
    } else {
        pending.callback("Screen is currently being shared.");
    }
};

// --- networked objects: distributed ownership via Lamport clocks ---

Networking.prototype.onObjectUpdate = function (data, peerId) {
    // drop streams from peers that lost the ownership arbitration
    if (this.objOwners[data.u] && this.objOwners[data.u].owner !== peerId) return;
    var obj = Networking.networkedObjects[data.u];
    if (obj) obj.fire('networkedObjectUpdate', data);
};

Networking.prototype.addObject = function (entity) {
    Networking.networkedObjects[entity._guid] = entity;
};

Networking.prototype.claimObject = function (uid) {
    if (!this.initialized) return;
    var clock = ++this.lamport;
    this.applyClaim(uid, clock, this.id);
    this.sendAction('oclaim', { u: uid, c: clock }, null);
};

Networking.prototype.applyClaim = function (uid, clock, claimant) {
    var current = this.objOwners[uid];
    // Latest claim wins (preserves "last collision claims" semantics);
    // lowest peerId breaks ties. Identical rule on every peer -> convergence.
    var wins = !current ||
        clock > current.clock ||
        (clock === current.clock && claimant < current.owner);
    if (!wins) return;
    this.objOwners[uid] = { owner: claimant, clock: clock };
    var obj = Networking.networkedObjects[uid];
    if (obj) obj.fire('networkedObjectOwner', claimant);
};

Networking.prototype.sendObjectUpdate = function (uid, pos, rot, angVel, linVel) {
    if (!this.initialized) return;
    if (this.objOwners[uid] && this.objOwners[uid].owner !== this.id) return;
    this.sendAction('objpose', {
        u: uid,
        p: [pos.x, pos.y, pos.z],
        r: [rot.x, rot.y, rot.z, rot.w],
        a: [angVel.x, angVel.y, angVel.z],
        l: [linVel.x, linVel.y, linVel.z]
    }, null);
};

// swap method called for script hot-reloading
// inherit your script state here
// Networking.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// https://developer.playcanvas.com/en/user-manual/scripting/
