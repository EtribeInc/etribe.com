/*jshint esversion: 9 */

var VideoController = pc.createScript('videoController');

VideoController.attributes.add('localVideoMat', {
    title: 'Local Screen Material',
    description: 'The screen material of the TV that displays the local video texture.',
    type: 'asset',
    assetType: 'material'
});

VideoController.attributes.add('localVideoMatAlpha', {
    title: 'Local Screen Material with alpha',
    description: 'The screen material of the TV that displays the local video texture with alpha.',
    type: 'asset',
    assetType: 'material'
});

VideoController.attributes.add('remoteVideoMat', {
    title: 'Remote Screen Material',
    description: 'The screen material of the TV that displays the remote video texture.',
    type: 'asset',
    assetType: 'material'
});

VideoController.attributes.add('playEvent', {
    title: 'Play Event',
    description: 'Event that is fired as soon as the video texture is ready to play.',
    type: 'string',
    default: ''
});

VideoController.attributes.add("videoPlaceholderTexture", {
    title: "Video Placeholder Texture",
    description: "Placholder Texture when video is disabled.",
    type: "asset",
    assetType: "texture"
});

VideoController.attributes.add('noVideoMat', {
    title: 'Material Replacement for no video',
    description: 'The screen material of the TV that is displayed when there is no video.',
    type: 'asset',
    assetType: 'material'
});

// remote video textures are refreshed at this rate, not every engine frame
var REMOTE_TEXTURE_HZ = 15;

// Newer engine versions removed emissiveTint and always multiply the
// emissive map by the emissive color. These materials were authored when
// the map replaced the color, so their black default now renders any video
// texture black - force white wherever we assign a video emissive map.
function forceEmissiveWhite(material) {
    material.emissive = pc.Color.WHITE;
    material.emissiveIntensity = 1;
}

// initialize code called once per entity
VideoController.prototype.initialize = function () {
    var self = this;

    this.remoteTextures = {};
    this.remoteVideos = {};
    this.remoteMaterials = {};
    this.remoteAudio = {};

    this.videoReady = false;
    this.remoteUploadAccum = 0;

    this.localScreenStream = null;
    this.activeShareId = null;

    this.entity.script.localVideo.on(this.playEvent, (canvas) => {
        this.canvas = canvas;
        this.initializeVideo(canvas);
    }, this);

    this.app.on("video:toggle", (bool) => {

        var material = this.localVideoMat.resource;
        forceEmissiveWhite(material);
        material.emissiveMap = bool ? this.videoTexture : this.videoPlaceholderTexture.resource;
        material.update();

        var matAlpha = this.localVideoMatAlpha.resource;
        forceEmissiveWhite(matAlpha);
        matAlpha.emissiveMap = bool ? this.videoTexture : this.videoPlaceholderTexture.resource;
        matAlpha.update();
    }, this);
};

// update code called every frame
VideoController.prototype.update = function (dt) {
    if (this.videoReady) {
        // Transfer the latest video frame to the video texture
        this.videoTexture.upload();
    }

    // with up to 15 remote textures, uploading every engine frame is a GPU
    // killer - cap at the stream frame rate
    this.remoteUploadAccum += dt;
    if (this.remoteUploadAccum >= 1 / REMOTE_TEXTURE_HZ) {
        this.remoteUploadAccum %= 1 / REMOTE_TEXTURE_HZ;
        for (var tex of Object.values(this.remoteTextures)) {
            tex.upload();
        }
    }
};

/*
 * Screen share: a second stream on the same room, tagged with the shareId.
 * No second client and no tokens. The local preview is routed through the
 * same handler remotes use, since own streams don't loop back.
 */
VideoController.prototype.shareScreen = async function (shareId) {
    var self = this;
    if (this.localScreenStream)
        this.stopScreenShare();

    var stream;
    try {
        stream = await navigator.mediaDevices.getDisplayMedia({
            video: { width: { max: 1280 }, height: { max: 720 }, frameRate: { max: 10 } },
            audio: true
        });
    } catch (err) {
        console.warn("Screen share cancelled or denied", err);
        return;
    }

    var videoTrack = stream.getVideoTracks()[0];
    videoTrack.contentHint = 'detail'; // prioritize resolution, keeps text readable

    this.localScreenStream = stream;
    this.activeShareId = shareId;

    var room = Networking.instance.room;
    var meta = { type: 'screen', shareId: shareId };

    // Send only to hello-confirmed peers (mesh-active peers still in the
    // airlock have no onPeerStream handler yet and would drop the stream
    // without replay); later arrivals are covered by _screenJoinHandler.
    this._screenPublishedTo = {};
    var ids = Object.keys(Networking.instance.players).filter((id) => id !== Networking.id);
    ids.forEach((id) => { self._screenPublishedTo[id] = true; });
    if (ids.length) {
        Promise.all(room.addStream(stream, { target: ids, metadata: meta }))
            .catch((err) => console.warn("screen addStream failed", err));
    }
    setTimeout(() => self.applyScreenSenderLimits(), 2000);

    Networking.instance.announceShare(shareId, true);

    // user hits the browser's own "Stop sharing" button
    videoTrack.addEventListener('ended', () => {
        self.stopScreenShare();
    });

    this._screenJoinHandler = function (id) {
        if (self._screenPublishedTo[id]) return;
        self._screenPublishedTo[id] = true;
        Promise.all(room.addStream(stream, { target: id, metadata: meta }))
            .catch((err) => console.warn("screen addStream failed", err));
        setTimeout(() => self.applyScreenSenderLimits(id), 2000);
    };
    this.app.on('p2p:peerJoin', this._screenJoinHandler, this);

    var videoInterface = this.entity.script.videoInterface;
    videoInterface.off("screen:stopShare", this.stopScreenShare, this);
    videoInterface.on("screen:stopShare", this.stopScreenShare, this);

    // local preview on the 3D screen surface
    videoInterface.handleScreenStream(stream, Networking.id, meta);
};

VideoController.prototype.stopScreenShare = function () {
    if (!this.localScreenStream) return;

    var room = Networking.instance.room;
    try {
        room.removeStream(this.localScreenStream);
    } catch (err) {
        console.warn("removeStream failed", err);
    }
    this.localScreenStream.getTracks().forEach((track) => track.stop());

    Networking.instance.announceShare(this.activeShareId, false);
    this.app.fire("screen:unpublished", this.activeShareId);

    if (this._screenJoinHandler) {
        this.app.off('p2p:peerJoin', this._screenJoinHandler, this);
        this._screenJoinHandler = null;
    }
    this.localScreenStream = null;
    this.activeShareId = null;
    this._screenPublishedTo = null;
};

VideoController.prototype.applyScreenSenderLimits = function (onlyPeerId) {
    if (!this.localScreenStream) return;
    var screenTrack = this.localScreenStream.getVideoTracks()[0];
    var peers = Networking.instance.room.getPeers();
    for (var peerId in peers) {
        if (onlyPeerId && peerId !== onlyPeerId) continue;
        var senders = peers[peerId].getSenders();
        for (var i = 0; i < senders.length; i++) {
            var sender = senders[i];
            if (sender.track !== screenTrack) continue;
            var params = sender.getParameters();
            if (!params.encodings || !params.encodings.length) params.encodings = [{}];
            params.encodings[0].maxBitrate = 600000;
            sender.setParameters(params).catch(() => {});
        }
    }
};


VideoController.prototype.initializeVideo = function (canvas) {
    console.log("VIDEOCONTROLLER: Init Video");
    // init local video
    // Create a texture to hold the video frame data
    this.videoTexture = new pc.Texture(this.app.graphicsDevice, {
        format: pc.PIXELFORMAT_R8_G8_B8,
        minFilter: pc.FILTER_LINEAR_MIPMAP_LINEAR,
        magFilter: pc.FILTER_LINEAR,
        addressU: pc.ADDRESS_CLAMP_TO_EDGE,
        addressV: pc.ADDRESS_CLAMP_TO_EDGE,
        mipmaps: true
    });

    this.videoTexture.setSource(canvas);

    // connect video to local material
    var material = this.localVideoMat.resource;
    forceEmissiveWhite(material);
    material.emissiveMap = this.app.videoToggle ? this.videoTexture : this.videoPlaceholderTexture.resource;
    material.update();

    var matAlpha = this.localVideoMatAlpha.resource;
    forceEmissiveWhite(matAlpha);
    matAlpha.emissiveMap = this.app.videoToggle ? this.videoTexture : this.videoPlaceholderTexture.resource;
    matAlpha.update();

    // set video ready for updating the texture every frame
    this.videoReady = true;
};

/*
 * Attach the media layer to the connected P2P room. Called by networking
 * once the room is joined (no credentials anymore).
 */
VideoController.prototype.connectToVideoService = async function () {
    var self = this;
    var videoInterface = this.entity.script.videoInterface;

    videoInterface.connect();

    // Publish exactly once: localVideo re-fires the play event whenever the
    // camera device is switched (srcObject reassignment restarts the media
    // element), but the published canvas capture keeps running unchanged -
    // re-publishing would push duplicate streams to every peer.
    var publishOnce = (canvas) => {
        if (this.published) return;
        this.published = true;
        // the fps cap here is the primary frame-rate control for every
        // outgoing camera connection
        videoInterface.publish(canvas.captureStream(15)).catch((err) => {
            console.error("publish failed", err);
            this.published = false;
        });
    };

    if (this.canvas) {
        publishOnce(this.canvas);
    } else {
        this.entity.script.localVideo.on(this.playEvent, publishOnce, this);
    }


    videoInterface.on("newRemoteStream", ({ uid, remoteStream }) => {
        console.log("-----------------new Video Stream!!!");
        self.updateRemoteMaterial(uid, remoteStream);
    });

    videoInterface.on("newAudioStream", ({ uid, remoteStream }) => {
        console.log("-----------------new Audio Stream!!!");
        self.updateRemoteAudio(uid, remoteStream);
    });

    videoInterface.on("userUnpublished", (user) => {
        console.log("user " + user.uid + " unpublished");
        this.entity.script.networking.assignVideoMaterial(user.uid, self.noVideoMat.resource);
    }, this);
};

VideoController.prototype.updateRemoteMaterial = function (uid, stream) {
    var self = this;
    if (self.remoteTextures[uid] && self.remoteVideos[uid]) {
        console.log("User video already present, reassigning ...");
        self.remoteVideos[uid].srcObject = stream;
        if (self.remoteVideos[uid].videoWidth) {
            self.remoteTextures[uid].setSource(self.remoteVideos[uid]);
        }
        // the persistent canplaythrough listener re-binds the texture once
        // frames flow; restore the video material right away (the screen may
        // currently show the no-video placeholder after an unmute)
        if (self.remoteMaterials[uid]) {
            self.entity.script.networking.assignVideoMaterial(uid, self.remoteMaterials[uid]);
        }
    } else {
        console.log("Creating remote Material");
        self.createRemoteMaterial(uid, stream);
    }

};

VideoController.prototype.updateRemoteAudio = function (uid, stream) {
    var self = this;

    console.log("Creating remote Audio");
    self.createRemoteAudio(uid, stream);

};

VideoController.prototype.createRemoteAudio = function (uid, stream) {
    this.entity.script.networking.assignRemoteAudio(uid, stream);

};

VideoController.prototype.createRemoteMaterial = function (uid, stream) {
    var self = this;

    // ------------- init remote video

    var video = document.createElement('video');

    video.loop = true;

    // muted attribute is required for videos to autoplay
    video.muted = true;

    // critical for iOS or the video won't initially play, and will go fullscreen when playing
    video.playsInline = true;

    // iOS video texture playback requires that you add the video to the DOMParser
    // with at least 1x1 as the video's dimensions
    var style = video.style;
    style.width = '1px';
    style.height = '1px';
    style.position = 'absolute';
    style.opacity = '0';
    style.zIndex = '-1000';
    style.pointerEvents = 'none';

    document.body.appendChild(video);

    video.srcObject = stream;

    // ------------- instantiate a video material and connect the video

    // no mipmaps: regenerating them on every upload for up to 15 remote
    // textures is needlessly expensive at this resolution
    var videoTexture = new pc.Texture(this.app.graphicsDevice, {
        format: pc.PIXELFORMAT_R8_G8_B8,
        minFilter: pc.FILTER_LINEAR,
        magFilter: pc.FILTER_LINEAR,
        addressU: pc.ADDRESS_CLAMP_TO_EDGE,
        addressV: pc.ADDRESS_CLAMP_TO_EDGE,
        mipmaps: false
    });

    video.addEventListener('canplaythrough', function (e) {
        console.log("can play through");
        video.play();
        // bind the source only now: the engine rejects video elements with
        // 0x0 dimensions and would silently keep a grey placeholder forever
        videoTexture.setSource(video);
        self.remoteVideos[uid] = video;
        self.remoteTextures[uid] = videoTexture;
        var material = self.remoteMaterials[uid];
        if (!material) {
            material = self.remoteVideoMat.resource.clone();
            forceEmissiveWhite(material);
            material.emissiveMap = videoTexture;
            material.update();
            self.remoteMaterials[uid] = material;
        }

        // return the material - unless the peer is currently muted, in which
        // case the placeholder stays until the next mediaSt unmute
        var videoOn = !VideoInterface.instance ||
            VideoInterface.instance.remoteVideoOn[uid] !== false;
        if (videoOn) {
            self.entity.script.networking.assignVideoMaterial(uid, material);
        }
    }.bind(this));

};

/*
 * Full teardown for a departed peer: stops the per-frame texture uploads
 * and releases the hidden video element. (The Agora version leaked these.)
 */
VideoController.prototype.removeRemote = function (uid) {
    var video = this.remoteVideos[uid];
    if (video) {
        video.pause();
        video.srcObject = null;
        video.remove();
        delete this.remoteVideos[uid];
    }
    var tex = this.remoteTextures[uid];
    if (tex) {
        tex.destroy();
        delete this.remoteTextures[uid];
    }
    delete this.remoteMaterials[uid];
};


// swap method called for script hot-reloading
// inherit your script state here
// VideoController.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// https://developer.playcanvas.com/en/user-manual/scripting/
