var ScreenShare = pc.createScript('screenShare');

ScreenShare.attributes.add("screenMaterialSrc", {
    title: "Screen Material",
    type: "asset",
    assetType: "material"
});

ScreenShare.attributes.add("videoController", {
    title: "Video Controller Entity",
    type: "entity"
});

ScreenShare.attributes.add("screenEntity", {
    title: "Screen Model Entity",
    type: "entity"
});

ScreenShare.attributes.add("screenUiEntity", {
    title: "Screen UI Entity",
    type: "entity"
});

ScreenShare.attributes.add("disableGroup", {
    title: "Disable Group",
    description: "Entitys to disable when screen share is active.",
    type: "entity",
    array: true
});

ScreenShare.attributes.add("cameraPose", {
    title: "Camera Pose Entity",
    description: "Entity that defines the camera pose for 'full screen'.",
    type: "entity"
});

ScreenShare.attributes.add("maxScreenDistance", {
    title: "Max Screen Distance",
    description: "Maximum distance from which full screen can be triggered by the user.",
    type: "number",
    default: 10
});

// initialize code called once per entity
ScreenShare.prototype.initialize = function () {
    this.screenMaterial = this.screenMaterialSrc.resource.clone();
    this.initialSize = this.screenEntity.getLocalScale().clone().x;
    this.screenEntity.setLocalScale(0, 0, 0);
    this.screenEntity.render.material = this.screenMaterial;
    this.shareId = "ScreenShare_" + this.entity._guid;
    this.entity.on("screen:request", this.requestShare, this);

    this.app.on("screen:newRemoteVideo", this.onNewVideo, this);

    this.app.on("screen:newAudioStream", this.onNewAudioStream, this);
    this.app.on("screen:newAudioTrack", this.onNewAudioTrack, this);

    this.app.on("screen:unpublished", this.onUnpublish, this);

    this.screenEntity.on("screen:full-screen", () => {
        if (this.shareActive) {
            if (this.fullScreen)
                this.onInput();
            else {
                let distance = this.entity.getPosition().distance(this.app.playerEntity.getPosition());
                console.log(distance);
                if (distance <= this.maxScreenDistance) {
                    this.fullScreen = true;
                    this.app.fire("camera:custom-pose", this.cameraPose.getPosition(), this.cameraPose.getRotation());
                    this.registerScreenEvents();
                }
            }
        }
    }, this);

    this.app.on("player:inMotion", () => {
        if (this.fullScreen) {
            this.fullScreen = false;
            this.app.fire("camera:clear-pose");
            this.removeScreenEvents();
        }
    }, this);
};

ScreenShare.prototype.registerScreenEvents = function () {
    console.log("Registering screen events");
    this.app.keyboard.on(pc.EVENT_KEYDOWN, this.onInput, this);
    if (this.app.touch) {
        this.app.touch.on(pc.EVENT_TOUCHSTART, this.onInput, this);
    }
};

ScreenShare.prototype.removeScreenEvents = function () {
    this.app.keyboard.off(pc.EVENT_KEYDOWN, this.onInput, this);
    if (this.app.touch) {
        this.app.touch.off(pc.EVENT_TOUCHSTART, this.onInput, this);
    }
};

ScreenShare.prototype.onInput = function () {
    this.app.fire("player:inMotion");
};

ScreenShare.prototype.onUnpublish = function (id) {
    if (id.includes(this.shareId)) {
        this.shareActive = false;
        console.log("Cleaning up screen share material ...");
        this.disableGroup.forEach((elem) => elem.enabled = true);
        delete this.videoTexture;
        this.screenMaterial.emissiveMap = null;
        this.screenMaterial.update();
        this.screenEntity
            .tween(this.screenEntity.getLocalScale())
            .to(new pc.Vec3(0, 0, 0), 1.0, pc.SineOut).start();
        if (this.fullScreen)
            this.app.fire("player:inMotion");
    }
};

ScreenShare.prototype.onNewVideo = function (id, videoElem) {
    if (id.includes(this.shareId)) {
        this.shareActive = true;
        console.log("New Screen Share Video @" + this.shareId);
        this.createScreenMaterial(videoElem);

        this.disableGroup.forEach((elem) => elem.enabled = false);
    }
};

ScreenShare.prototype.onNewAudioStream = function (id, stream) {
    if (id.includes(this.shareId)) {
        console.log("New Screen Share Audio @" + this.shareId);
    }
};

ScreenShare.prototype.onNewAudioTrack = function (id, track) {
    if (id.includes(this.shareId)) {
        console.log("New Screen Share Audio @" + this.shareId);
    }
};

ScreenShare.prototype.requestShare = async function () {
    if (this.requestPending)
        return;
    console.log("Screen Share!!!");
    var self = this;
    this.requestPending = true;
    Networking.instance.requestScreenShare(self.shareId, (error, data) => {

        this.requestPending = false;
        if (error) {
            alert(error);
        } else {
            var panel = document.getElementById("tc-screen-sharing");
            panel.replaceWith(panel = panel.cloneNode(true));
            panel.classList.remove('tc-visible');
            //console.log(panel);
            panel.getElementsByClassName("tc-screen-sharing-title").item(1).innerHTML = "Ready to share a tab, window, or your screen with the club?";
            panel.querySelector(".tc-screen-sharing-title").innerHTML = "Start Screen Share?";

            var yes = (e) => {
                e.stopPropagation();
                this.videoController.script.videoController.shareScreen(this.shareId, data, (videoElem) => {
                    console.log(videoElem);
                    //self.createScreenMaterial(videoElem);
                });
                panel.classList.add('tc-visible');
            };
            var no = (e) => {
                e.stopPropagation();
                panel.classList.add('tc-visible');

            };


            panel.querySelector("#tc-screen-sharing-btn-left").addEventListener("click", no);

            panel.querySelector("#tc-screen-sharing-btn-right").addEventListener("click", yes);

        }
    });
    //this.videoController.script.videoController.shareScreen((elem)=>{console.log(elem);});
};

ScreenShare.prototype.createScreenMaterial = function (video) {
    var self = this;
    // ------------- init remote video 

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

    // ------------- instantiate a video material and connect the video

    this.videoTexture = new pc.Texture(this.app.graphicsDevice, {
        format: pc.PIXELFORMAT_R8_G8_B8,
        minFilter: pc.FILTER_LINEAR_MIPMAP_LINEAR,
        magFilter: pc.FILTER_LINEAR,
        addressU: pc.ADDRESS_CLAMP_TO_EDGE,
        addressV: pc.ADDRESS_CLAMP_TO_EDGE,
        mipmaps: true
    });
    this.videoTexture.setSource(video);

    video.addEventListener('canplaythrough', function (e) {
        console.log("can play through");
        video.play();
        var aspect = video.videoWidth / video.videoHeight;
        console.log(aspect);
        if (aspect <= 1) {
            this.screenUiEntity.setLocalScale(1, 1, aspect);
            this.screenEntity.tween(this.screenEntity.getLocalScale()).to(new pc.Vec3(this.initialSize * aspect, this.initialSize, this.initialSize), 1.0, pc.SineOut).start();
        }
        else {
            this.screenUiEntity.setLocalScale((1 / aspect), 1, 1);
            this.screenEntity.tween(this.screenEntity.getLocalScale()).to(new pc.Vec3(this.initialSize, this.initialSize, this.initialSize * (1 / aspect)), 1.0, pc.SineOut).start();
        }
        // self.remoteVideos[uid] = video;
        // self.remoteTextures[uid] = videoTexture;
        self.screenMaterial.emissiveMap = this.videoTexture;
        self.screenMaterial.update();
        // return the material
        //self.entity.script.networking.assignVideoMaterial(uid, material);
    }.bind(this));

};

// update code called every frame
ScreenShare.prototype.update = function (dt) {
    if (this.videoTexture)
        this.videoTexture.upload();
};

// swap method called for script hot-reloading
// inherit your script state here
// ScreenShare.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// https://developer.playcanvas.com/en/user-manual/scripting/