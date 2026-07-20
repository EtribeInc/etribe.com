/*jshint esversion: 9 */

/*
 * P2P media layer over the shared Trystero room (owned by networking.js).
 *
 * Replaces the Agora client. The local camera-canvas video track and the
 * microphone track are published as one MediaStream tagged {type:'camera'};
 * screen shares are a second stream tagged {type:'screen'} (see
 * videoController.js). Incoming streams are routed by that metadata to the
 * same events the Agora version fired ("newRemoteStream", "newAudioStream",
 * "userUnpublished"), so the texture/audio pipelines downstream are unchanged.
 *
 * Mute never renegotiates: tracks are toggled via track.enabled and the new
 * state is broadcast as a 'mediaSt' action so remotes can swap to the
 * no-video placeholder (Agora's unpublish event used to signal this).
 */

var VideoInterface = pc.createScript('videoInterface');

VideoInterface.instance = null;

// initialize code called once per entity
VideoInterface.prototype.initialize = function () {
    VideoInterface.instance = this;

    this.room = null;
    this.localStream = null;
    this.localVideoTrack = null;
    this.localAudioTrack = null;
    this.cachedCameraStreams = {};   // peerId -> camera MediaStream
    this.publishedTo = {};           // peerId -> we already sent them our stream
    this.remoteVideoOn = {};         // peerId -> last known camera mute state
};

/*
 * Attach to the connected room. Called by videoController once networking
 * has joined (replaces the old token-based channel join).
 */
VideoInterface.prototype.connect = function () {
    this.room = Networking.instance.room;

    this.app.on('p2p:peerStream', this.onPeerStream, this);
    this.app.on('p2p:peerLeave', this.onPeerLeave, this);

    Networking.instance.onAction('mediaSt', (state, peerId) => {
        this.onMediaState(state, peerId);
    });

    console.log("video interface connected");
};

/*
 * Route incoming streams by their metadata tag.
 */
VideoInterface.prototype.onPeerStream = function (stream, peerId, metadata) {
    var meta = metadata || { type: 'camera' };

    if (meta.type === 'screen') {
        this.handleScreenStream(stream, peerId, meta);
        return;
    }

    this.cachedCameraStreams[peerId] = stream;

    var videoTrack = stream.getVideoTracks()[0];
    var audioTrack = stream.getAudioTracks()[0];
    if (videoTrack) {
        this.fire("newRemoteStream", { uid: peerId, remoteStream: new MediaStream([videoTrack]) });
    }
    if (audioTrack) {
        this.fire("newAudioStream", { uid: peerId, remoteStream: new MediaStream([audioTrack]) });
    }
};

/*
 * Screen share streams keep the Agora-era DOM contract: a hidden container
 * div whose id is the shareId, holding the <video>, announced via the same
 * "screen:*" app events screenShare.js already consumes.
 */
VideoInterface.prototype.handleScreenStream = function (stream, peerId, meta) {
    var shareId = meta.shareId;
    if (!shareId) {
        console.warn("Screen stream without shareId metadata from " + peerId);
        return;
    }

    var screenElem = document.getElementById(shareId);
    if (!screenElem) {
        screenElem = document.createElement('div');
        screenElem.setAttribute("id", shareId);
        document.body.append(screenElem);
    }
    var video = screenElem.querySelector("video");
    if (!video) {
        video = document.createElement('video');
        video.autoplay = true;
        video.muted = true;
        video.playsInline = true;
        screenElem.appendChild(video);
    }
    video.srcObject = stream;

    this.app.fire("screen:newRemoteVideo", shareId, video);

    var audioTracks = stream.getAudioTracks();
    if (audioTracks.length) {
        this.app.fire("screen:newAudioStream", shareId, new MediaStream([audioTracks[0]]));
    }

    // backup teardown; the broadcast 'share' action is the primary signal
    var videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
        videoTrack.addEventListener('ended', () => {
            this.app.fire("screen:unpublished", shareId);
        });
    }
};

VideoInterface.prototype.muteVideo = function (bool) {
    console.log("Muting Video: " + bool.toString());
    if (this.localVideoTrack) this.localVideoTrack.enabled = !bool;
    this.sendMediaState(null);
};

VideoInterface.prototype.muteAudio = function (bool) {
    console.log("Muting Audio: " + bool.toString());
    if (this.localAudioTrack) this.localAudioTrack.enabled = !bool;
    this.sendMediaState(null);
};

VideoInterface.prototype.sendMediaState = function (targetPeerId) {
    if (!Networking.instance || !Networking.instance.initialized) return;
    Networking.instance.sendAction('mediaSt', {
        video: !!(this.localVideoTrack && this.localVideoTrack.enabled),
        audio: !!(this.localAudioTrack && this.localAudioTrack.enabled)
    }, targetPeerId || null);
};

VideoInterface.prototype.onMediaState = function (state, peerId) {
    this.remoteVideoOn[peerId] = !!state.video;
    if (!state.video) {
        // remote camera off -> videoController swaps in the placeholder material
        this.fire("userUnpublished", { uid: peerId });
    } else {
        var cached = this.cachedCameraStreams[peerId];
        var videoTrack = cached && cached.getVideoTracks()[0];
        if (videoTrack) {
            this.fire("newRemoteStream", { uid: peerId, remoteStream: new MediaStream([videoTrack]) });
        }
    }
};

/*
 * Publish the local camera-canvas stream plus the microphone.
 * `stream` is the canvas captureStream from videoController.
 */
VideoInterface.prototype.publish = async function (stream) {
    var self = this;

    this.localVideoTrack = stream.getVideoTracks()[0];

    var audioConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
    };
    if (this.app.audioInputDevice) {
        audioConstraints.deviceId = { exact: this.app.audioInputDevice };
    }
    var micStream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints, video: false });
    this.localAudioTrack = micStream.getAudioTracks()[0];

    this.localStream = new MediaStream([this.localVideoTrack, this.localAudioTrack]);

    // Publish only to hello-confirmed peers: a peer can already be active in
    // the Trystero mesh while still sitting in the airlock, where its
    // onPeerStream handler is not assigned yet - streams sent there are
    // dropped without replay. Such peers get the stream via 'p2p:peerJoin'
    // below, which fires only once their hello arrived.
    var ids = Object.keys(Networking.instance.players).filter((id) => id !== Networking.id);
    ids.forEach((id) => { self.publishedTo[id] = true; });
    if (ids.length) {
        Promise.all(this.room.addStream(this.localStream, { target: ids, metadata: { type: 'camera' } }))
            .catch((err) => console.warn("camera addStream failed", err));
    }
    setTimeout(() => self.applySenderLimits(), 2000);

    // publish to peers that arrive later, and send them our mute state
    this.app.on('p2p:peerJoin', (id) => {
        if (!self.publishedTo[id]) {
            self.publishedTo[id] = true;
            Promise.all(self.room.addStream(self.localStream, { target: id, metadata: { type: 'camera' } }))
                .catch((err) => console.warn("camera addStream failed", err));
            setTimeout(() => self.applySenderLimits(id), 2000);
        }
        self.sendMediaState(id);
    }, this);

    // microphone device switch: replaceTrack avoids renegotiation
    this.entity.on('audio:input', async (id) => {
        try {
            var constraints = {
                deviceId: { exact: id },
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            };
            var newMicStream = await navigator.mediaDevices.getUserMedia({ audio: constraints, video: false });
            var newTrack = newMicStream.getAudioTracks()[0];
            var oldTrack = self.localAudioTrack;
            newTrack.enabled = oldTrack ? oldTrack.enabled : true;
            // replaceTrack returns one promise per peer connection
            await Promise.all(self.room.replaceTrack(oldTrack, newTrack));
            // keep localStream current: late joiners get the stream as-is
            self.localStream.removeTrack(oldTrack);
            self.localStream.addTrack(newTrack);
            oldTrack.stop();
            self.localAudioTrack = newTrack;
            setTimeout(() => self.applySenderLimits(), 2000);
        } catch (err) {
            console.error("Failed to switch microphone", err);
        }
    }, this);

    this.entity.on('mute:video', (bool) => {
        this.muteVideo(bool);
    }, this);

    // Auto-mute the camera while the window is unfocused (the hidden tab's
    // render loop freezes the canvas anyway). Disable with ?keepvideo=1 -
    // essential when testing with two tabs/windows on one machine, where
    // focusing the receiver always blurs (and thus mutes) the sender.
    if (!getURLParameter('keepvideo')) {
        window.addEventListener("blur", () => {
            this.muteVideo(true);
        });

        window.addEventListener("focus", () => {
            this.muteVideo(!this.app.videoToggle);
        });
    }

    this.muteVideo(!this.app.videoToggle);

    this.entity.on('mute:voice', (bool) => {
        this.muteAudio(bool);
    }, this);

    this.muteAudio(!this.app.micToggle);

    console.log("publish success");
};

/*
 * Cap outgoing bitrates. Each of the up-to-15 peer connections encodes
 * independently, so the camera must stay small: 250 kbps / 15 fps video,
 * 24 kbps Opus audio. Idempotent; re-run after addStream since senders
 * appear only once negotiation settles.
 */
VideoInterface.prototype.applySenderLimits = function (onlyPeerId) {
    if (!this.room) return;
    var peers = this.room.getPeers();
    for (var peerId in peers) {
        if (onlyPeerId && peerId !== onlyPeerId) continue;
        var senders = peers[peerId].getSenders();
        for (var i = 0; i < senders.length; i++) {
            var sender = senders[i];
            if (!sender.track) continue;
            var params = sender.getParameters();
            if (!params.encodings || !params.encodings.length) params.encodings = [{}];
            if (sender.track === this.localVideoTrack) {
                params.encodings[0].maxBitrate = 250000;
                params.encodings[0].maxFramerate = 15;
            } else if (sender.track === this.localAudioTrack) {
                params.encodings[0].maxBitrate = 24000;
            } else {
                continue;
            }
            sender.setParameters(params).catch(() => { /* renegotiation in flight, next run applies */ });
        }
    }
};

VideoInterface.prototype.onPeerLeave = function (peerId) {
    delete this.cachedCameraStreams[peerId];
    delete this.publishedTo[peerId];
    delete this.remoteVideoOn[peerId];
    this.fire("userUnpublished", { uid: peerId });
    var videoController = this.entity.script.videoController;
    if (videoController) videoController.removeRemote(peerId);
};

// swap method called for script hot-reloading
// inherit your script state here
// VideoInterface.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// http://developer.playcanvas.com/en/user-manual/scripting/
