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

// initialize code called once per entity
VideoController.prototype.initialize = function () {
    var self = this;

    this.remoteTextures = {};
    this.remoteVideos = {};
    this.remoteAudio = {};

    this.videoReady = false;

    this.entity.script.localVideo.on(this.playEvent, (canvas) => {
        this.canvas = canvas;
        this.initializeVideo(canvas);
    }, this);

    this.app.on("video:toggle", (bool) => {

        var material = this.localVideoMat.resource;
        material.emissiveMap = bool ? this.videoTexture : this.videoPlaceholderTexture.resource;
        material.update();

        var matAlpha = this.localVideoMatAlpha.resource;
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

    for (var tex of Object.values(this.remoteTextures)) {
        tex.upload();
    }
};

VideoController.prototype.shareScreen = async function (shareId, { appid, channel, token }, callback) {
    var self = this;
    if (this.localScreenTrack)
        this.stopScreenShare();
    AgoraRTC.createScreenVideoTrack({
        // Set the encoder configurations. For details, see the API description.
        encoderConfig: "1080p_2",
        // Set the video transmission optimization mode as prioritizing video quality.
        optimizationMode: "detail"
    }, "auto").then(async tracks => {
        if (Array.isArray(tracks)) {
            this.localScreenTrack = tracks[0];
            this.localScreenAudioTrack = tracks[1];
        } else {
            this.localScreenTrack = tracks;
        }
        if (!this.shareClient) {
            this.shareClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
            this.shareClient.on("token-privilege-will-expire", () => {
                // renew share token
                self.entity.script.networking.getNewShareToken(shareId);
            });
            await this.shareClient.join(appid, channel, token, shareId);
        }
        // let screenElem = document.getElementById("localScreenShare");
        // if(!screenElem){
        //     screenElem = document.createElement('div');
        //     screenElem.setAttribute("id", "localScreenShare");
        // }
        // document.body.append(screenElem);
        //this.localScreenTrack.play(screenElem);
        //callback(screenElem.querySelector("video"));
        this.localScreenTrack.on('track-ended', async () => {
            this.stopScreenShare();
        });
        this.shareClient.publish(this.localScreenTrack);
        if (this.localScreenAudioTrack) this.shareClient.publish(this.localScreenAudioTrack);
        this.entity.script.videoInterface.on("screen:stopShare", this.stopScreenShare, this);
    });
};

VideoController.prototype.stopScreenShare = async function () {
    if (this.shareClient) {
        await this.shareClient.unpublish(this.localScreenTrack);
        await this.shareClient.leave();
        this.localScreenTrack.close();
        delete this.localScreenTrack;
        delete this.shareClient;
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
    material.emissiveMap = this.app.videoToggle ? this.videoTexture : this.videoPlaceholderTexture.resource;
    material.update();

    var matAlpha = this.localVideoMatAlpha.resource;
    matAlpha.emissiveMap = this.app.videoToggle ? this.videoTexture : this.videoPlaceholderTexture.resource;
    matAlpha.update();

    // set video ready for updating the texture every frame
    this.videoReady = true;
};

VideoController.prototype.connectToVideoService = async function (appid, uid, channel, token) {
    var self = this;
    var videoInterface = this.entity.script.videoInterface;

    // connect via service specific video interface
    await videoInterface.connect(appid, uid, channel, token);


    if (this.canvas) {
        // publish video to video service via service specific video interface
        var stream = this.canvas.captureStream();

        videoInterface.publish(stream);
    } else {
        this.entity.script.localVideo.on(this.playEvent, (canvas) => {
            // publish video to video service via service specific video interface
            var stream = canvas.captureStream();

            videoInterface.publish(stream);
        });
    }


    videoInterface.on("newRemoteStream", ({ uid, remoteStream }) => {
        console.log("-----------------new Video Stream!!!");
        self.updateRemoteMaterial(uid, remoteStream);
    });

    videoInterface.on("newAudioStream", ({ uid, remoteStream }) => {
        console.log("-----------------new Audio Stream!!!");
        self.updateRemoteAudio(uid, remoteStream);
    });

    videoInterface.on("newAudioTrack", ({ uid, audioTrack }) => {
        console.log("-----------------new Audio Track!!!");
        this.entity.script.networking.assignRemoteAudioTrack(uid, audioTrack);
    });

    videoInterface.on("userUnpublished", (user) => {
        console.log("user " + user.uid + " unpublished");
        this.entity.script.networking.assignVideoMaterial(user.uid, self.noVideoMat.resource);
    }, this);
};

VideoController.prototype.renewToken = function (token) {
    this.entity.script.videoInterface.renewToken(token);
};

VideoController.prototype.renewShareToken = async function (token) {
    if (this.shareClient) {
        await this.shareClient.renewToken(token);
        console.log("Share video token renewed.");
    }
};

VideoController.prototype.updateRemoteMaterial = function (uid, stream) {
    var self = this;
    if (self.remoteTextures[uid] && self.remoteVideos[uid]) {
        console.log("User video already present, reassigning ...");
        self.remoteVideos[uid].srcObject = stream;
        self.remoteTextures[uid].setSource(self.remoteVideos[uid]);
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

    var videoTexture = new pc.Texture(this.app.graphicsDevice, {
        format: pc.PIXELFORMAT_R8_G8_B8,
        minFilter: pc.FILTER_LINEAR_MIPMAP_LINEAR,
        magFilter: pc.FILTER_LINEAR,
        addressU: pc.ADDRESS_CLAMP_TO_EDGE,
        addressV: pc.ADDRESS_CLAMP_TO_EDGE,
        mipmaps: true
    });

    videoTexture.setSource(video);

    video.addEventListener('canplaythrough', function (e) {
        console.log("can play through");
        video.play();
        self.remoteVideos[uid] = video;
        self.remoteTextures[uid] = videoTexture;
        var material = self.remoteVideoMat.resource.clone();
        material.emissiveMap = videoTexture;
        material.update();

        // return the material
        self.entity.script.networking.assignVideoMaterial(uid, material);
    }.bind(this));

};


// swap method called for script hot-reloading
// inherit your script state here
// VideoController.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// https://developer.playcanvas.com/en/user-manual/scripting/