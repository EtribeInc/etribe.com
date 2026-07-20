/*jshint esversion: 9 */
var LocalVideo = pc.createScript('localVideo');

LocalVideo.attributes.add('playEvent', {
    title: 'Play Event',
    description: 'Event that is fired as soon as the video texture is ready to play.',
    type: 'string',
    default: ''
});

LocalVideo.attributes.add('lerpSpeed', {
    title: 'Lerp Speed',
    description: 'Speed to adjust how fast the cropping to detected face is adjusted.',
    type: 'number',
    default: 2.0
});

LocalVideo.attributes.add('useFaceCrop', {
    title: 'Use Face Crop',
    description: 'Weather to use face detection to crop face or not',
    type: 'boolean',
    default: true
});

LocalVideo.attributes.add('useHandDetection', {
    title: 'Use Hand Detection',
    description: 'Weather to use Hand detection or not',
    type: 'boolean',
    default: true
});

LocalVideo.attributes.add("handCountToStart", {
    title: "Hand Count",
    description: "Consecutive detections needed for triggering Animation.",
    type: "number",
    default: 3
});

LocalVideo.attributes.add("workerScript", {
    type: "asset",
    title: "Worker Script",
    assetType: "script"
});

LocalVideo.attributes.add("handWorkerScript", {
    type: "asset",
    title: "Hand Worker Script",
    assetType: "script"
});

LocalVideo.attributes.add("tensorFlow", {
    type: "asset",
    title: "TensorFlow Script",
    assetType: "script"
});

LocalVideo.attributes.add("tensorFlowBackend", {
    type: "asset",
    title: "TensorFlow Backend Script",
    assetType: "script"
});

LocalVideo.attributes.add("tensorFlowModel", {
    type: "asset",
    title: "Model"
});

LocalVideo.attributes.add("handModel", {
    type: "asset",
    title: "Hand Model"
});

LocalVideo.attributes.add("wasmPaths", {
    type: "json",
    schema: [{
        name: "wasm",
        type: "asset",
        assetType: "wasm"
    },
    {
        name: "wasm_simd",
        type: "asset",
        assetType: "wasm"
    },
    {
        name: "wasm_threaded_simd",
        type: "asset",
        assetType: "wasm"
    }]
});


LocalVideo.prototype.useCustomCanvas = function (canvas) {
    // Do NOT swap the internal canvas: the avatar video texture and the
    // published P2P stream are bound to it (videoController holds it from
    // the play event). The HUD canvas becomes a second output that receives
    // a copy of every frame in update() instead.
    this.outputCanvas = canvas;
    this.outputCtx = canvas.getContext('2d');
};

// normalized [[x0,y0],[x1,y1]] of the largest centered square in the video
LocalVideo.prototype.centerCropNormalized = function () {
    var vw = this.video.videoWidth;
    var vh = this.video.videoHeight;
    var size = Math.min(vw, vh);
    var x0 = (vw - size) / 2 / vw;
    var y0 = (vh - size) / 2 / vh;
    return [[x0, y0], [x0 + size / vw, y0 + size / vh]];
};

LocalVideo.prototype.drawCenterCrop = function () {
    var vw = this.video.videoWidth;
    var vh = this.video.videoHeight;
    var size = Math.min(vw, vh);
    this.ctx.drawImage(this.video,
        (vw - size) / 2, (vh - size) / 2, size, size,
        0, 0, this.canvas.width, this.canvas.height);
};

// initialize code called once per entity
LocalVideo.prototype.initialize = function () {
    this.lerpSpeed = 30;
    var app = this.app;
    var self = this;

    //this.useFaceCrop = (window.location.href.indexOf("playcanvas") == -1);
    /// --- VARIABLE Init --- ///
    self.cropArea = [[0, 0], [0, 0]];
    self.cropTarget = [[0, 0], [0, 0]];
    self.lerpedCrop = [[0, 0], [0, 0]];

    self.faceReady = false;
    self.hasFaceTarget = false;
    self.handReady = false;

    self.handCounter = 0;
    self.handNullCounter = 0;

    self.videoPlaying = false;

    self.lerpVal = 0;

    // Create HTML Video Element to play the video
    self.video = document.createElement('video');
    // Create Canvas Video Element to display cropped Video

    self.canvas = document.createElement('canvas');
    //TODO only create one SRC canvas for both face and hand detection
    // Create Canvas Video Element for sending data to webworker
    self.canvasSrc = document.createElement('canvas');


    ///----------------------///


    self.video.loop = true;

    // muted attribute is required for videos to autoplay
    self.video.muted = true;

    // critical for iOS or the video won't initially play, and will go fullscreen when playing
    self.video.playsInline = true;

    // iOS video texture playback requires that you add the video to the DOMParser
    // with at least 1x1 as the video's dimensions
    var style = self.video.style;
    style.width = '1px';
    style.height = '1px';
    style.position = 'absolute';
    style.opacity = '0';
    style.zIndex = '-1000';
    style.pointerEvents = 'none';

    document.body.appendChild(self.video);

    self.canvas.style.width = "1px";
    self.canvas.style.height = "1px";
    self.canvas.style.position = "absolute";
    self.canvas.width = 256;
    self.canvas.height = 256;
    self.ctx = self.canvas.getContext('2d');
    document.body.appendChild(self.canvas);

    self.canvasSrc.style.visibility = "hidden";
    self.canvasSrc.style.width = '1px';
    self.canvasSrc.style.height = '1px';
    self.ctxSrc = self.canvasSrc.getContext('2d');
    document.body.appendChild(self.canvasSrc);



    // video media constraints
    var constraints = { audio: false, video: true };

    //get audio permission
    navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    //get webcam stream with constraints
    navigator.mediaDevices.getUserMedia(constraints)
        .then(function (mediaStream) {
            //set video src to webcam stream
            self.video.srcObject = mediaStream;
            self.video.onloadeddata = function (e) {
                self.canvasSrc.width = this.videoWidth;
                self.canvasSrc.height = this.videoHeight;
            };
            window.addEventListener("resize", function (event) {
                self.canvasSrc.width = self.video.videoWidth;
                self.canvasSrc.height = self.video.videoHeight;
            });
            self.video.addEventListener('canplaythrough', function (e) {
                //let everyone know video is playable now and send canvas to listeners
                self.fire(self.playEvent, self.canvas);
                self.video.play();
                self.videoPlaying = true;
                //set tensorflow backend after tf is ready and start processing frames after everything is ready
                //tf.ready().then(()=> tf.setBackend('wasm').then(() => self.processFrame()));
                // listen to webworker if any message is there
                if (this.useFaceCrop) {
                    console.log("Face follow speed is: " + this.lerpSpeed);
                    console.log(new URL(this.tensorFlow.getFileUrl(), window.location.origin).href);

                    // creating Webworker for faceDetection
                    this.worker = new Worker(this.workerScript.getFileUrl());
                    this.worker.addEventListener("message", (event) => this.handleWorkerEvent(event));
                    this.worker.postMessage({
                        "setup": {
                            "tfjs": new URL(this.tensorFlow.getFileUrl(), window.location.href).href,
                            "backend": new URL(this.tensorFlowBackend.getFileUrl(), window.location.href).href,
                            "wasmPaths": {
                                "wasm": new URL(this.wasmPaths.wasm.getFileUrl(), window.location.href).href,
                                "simd": new URL(this.wasmPaths.wasm_simd.getFileUrl(), window.location.href).href,
                                "threaded": new URL(this.wasmPaths.wasm_threaded_simd.getFileUrl(), window.location.href).href
                            },
                            "model": new URL(this.tensorFlowModel.getFileUrl(), window.location.href).href
                        }
                    });

                } else {
                    self.faceReady = true;
                }

                if (this.useHandDetection) {
                    this.handWorker = new Worker(this.handWorkerScript.getFileUrl());
                    this.handWorker.addEventListener("message", (event) => this.handleHandWorkerEvent(event));
                    this.handWorker.postMessage({
                        "setup": {
                            "tfjs": new URL(this.tensorFlow.getFileUrl(), window.location.href).href,
                            "backend": new URL(this.tensorFlowBackend.getFileUrl(), window.location.href).href,
                            "wasmPaths": {
                                "wasm": new URL(this.wasmPaths.wasm.getFileUrl(), window.location.href).href,
                                "simd": new URL(this.wasmPaths.wasm_simd.getFileUrl(), window.location.href).href,
                                "threaded": new URL(this.wasmPaths.wasm_threaded_simd.getFileUrl(), window.location.href).href
                            },
                            "model": new URL(this.handModel.getFileUrl(), window.location.href).href
                        }
                    });
                } else {
                    self.handReady = true;
                }
            }.bind(self));

        }.bind(self))
        .catch(function (err) { console.log(err.name + ": " + err.message); }); // always check for errors at the end.

    self.entity.on("video:input", (deviceId) => {
        console.log("setting new video device: " + deviceId);
        var constraints = { audio: false, video: { deviceId: deviceId } };
        navigator.mediaDevices.getUserMedia(constraints).then(function (mediaStream) {
            self.video.srcObject = mediaStream;
        }.bind(self));
    }, self);
    //handle stuff when video starts playing
    self.video.addEventListener('play', function () {


    }, false);

    this.on("destroy", () => {
        if (this.worker)
            this.worker.terminate();
        if (this.handWorker)
            this.handWorker.terminate();
        this.canvas.remove();
        this.canvasSrc.remove();
        this.video.remove();
    }, this);
};


LocalVideo.prototype.handleHandWorkerEvent = function (event) {
    switch (event.data.type) {
        case "message":
            console.log(event.data.msg);
            break;
        case "setup":
            if (event.data.result === "success") {
                this.handReady = true;
                this.nexthand = true;
            }
            else
                console.error("TFJS setup failed.");
            break;
        case "data":
            switch (event.data.pose) {
                case "wave":
                    this.handCounter += 1;
                    this.handNullCounter = 0;
                    if (this.handCounter == this.handCountToStart)
                        this.app.fire("player:wavestart");
                    break;
                case "thumbs":
                default:
                    this.handCounter = 0;
                    this.handNullCounter += 1;
                    if (this.handNullCounter == this.handCountToStart)
                        this.app.fire("player:wavestop");
                    break;

            }
            this.nexthand = true;
            break;
        default:
            console.log(event.data);
            break;
    }
};


LocalVideo.prototype.handleWorkerEvent = function (event) {
    switch (event.data.type) {
        case "message":
            console.log(event.data.msg);
            break;
        case "setup":
            if (event.data.result === "success") {
                this.faceReady = true;
                this.nextFace = true;
            }
            else
                console.error("TFJS setup failed.");
            break;
        case "data":
            this.lerpVal = 0;
            this.cropArea = this.lerpedCrop;
            if (event.data.cropTarget) {
                if (!this.hasFaceTarget) {
                    // first detection: hand over smoothly from the centered
                    // square fallback by starting the lerp at its coordinates
                    this.lerpedCrop = this.centerCropNormalized();
                    this.cropArea = this.lerpedCrop;
                    this.hasFaceTarget = true;
                }
                this.cropTarget = event.data.cropTarget;
            }
            this.nextFace = true;
            break;
        default:
            console.log(event.data);
            break;
    }
};

//process a frame in webworker
LocalVideo.prototype.processFrame = function (worker) {
    if (this.videoPlaying) {

        //send data to worker
        var myImageData = this.ctxSrc.getImageData(0, 0, this.canvasSrc.width, this.canvasSrc.height).data;

        worker.postMessage({
            "imgData": myImageData,
            "width": this.canvasSrc.width,
            "height": this.canvasSrc.height
        });
    }
};

// update code called every frame
LocalVideo.prototype.update = function (dt) {
    this.ctxSrc.drawImage(this.video, 0, 0, this.canvasSrc.width, this.canvasSrc.height);
    if (this.nextFace) {
        this.nextFace = false;
        this.processFrame(this.worker);
    }
    if (this.nexthand) {
        this.nexthand = false;
        this.processFrame(this.handWorker);
    }

    if (this.videoPlaying && this.video.videoWidth) {
        if (this.useFaceCrop && this.faceReady && this.hasFaceTarget) {
            //update cropping with detected face
            this.updateVideoCanvas(dt);
        } else {
            // fallback until face tracking is ready (or if it never gets
            // there): fixed square cut from the center of the video
            this.drawCenterCrop();
        }

        // mirror the frame into the HUD canvas, if one was registered
        if (this.outputCanvas) {
            this.outputCtx.drawImage(this.canvas, 0, 0, this.outputCanvas.width, this.outputCanvas.height);
        }
    }

};

//update cropping with detected face area
LocalVideo.prototype.updateVideoCanvas = function (dt) {
    if (this.lerpedCrop && this.cropTarget) {


        // get max crop distance to speed up lerping for greater distances
        var cropDist = Math.max(
            Math.abs(this.lerpedCrop[0][0] - this.cropTarget[0][0]),
            Math.abs(this.lerpedCrop[1][1] - this.cropTarget[1][1]),
            Math.abs(this.lerpedCrop[0][1] - this.cropTarget[0][1]),
            Math.abs(this.lerpedCrop[1][0] - this.cropTarget[1][0])
        );
        // calculate current lerp value depenging on lerpSpeed and max crop distance
        this.lerpVal += dt * this.lerpSpeed * cropDist;

        //lerp values for smooth cropping adjustments
        this.lerpedCrop[0][0] = pc.math.lerp(this.cropArea[0][0], this.cropTarget[0][0], this.lerpVal);
        this.lerpedCrop[0][1] = pc.math.lerp(this.cropArea[0][1], this.cropTarget[0][1], this.lerpVal);
        this.lerpedCrop[1][0] = pc.math.lerp(this.cropArea[1][0], this.cropTarget[1][0], this.lerpVal);
        this.lerpedCrop[1][1] = pc.math.lerp(this.cropArea[1][1], this.cropTarget[1][1], this.lerpVal);

        var width = this.lerpedCrop[1][0] - this.lerpedCrop[0][0];
        var height = this.lerpedCrop[1][1] - this.lerpedCrop[0][1];
        // draw cropped image to canvas context (src of video texture)
        this.ctx.drawImage(this.video, this.lerpedCrop[0][0] * this.video.videoWidth, this.lerpedCrop[0][1] * this.video.videoHeight, width * this.video.videoWidth, height * this.video.videoHeight, 0, 0, this.canvas.width, this.canvas.height);
    }

};
