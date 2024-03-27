var AnimationHandler = pc.createScript('animationHandler');


// initialize code called once per entity
AnimationHandler.prototype.initialize = function () {
    this.modelHandler = this.entity.script.get("modelHandler");

    // Base Layer
    this.app.on('player:walk', () => this.modelHandler.updateAnimation(animLayers.BASE, baselayerAnimStates.WALK), this);
    this.on('destroy', function () {
        this.app.off('player:walk', () => this.modelHandler.updateAnimation(animLayers.BASE, baselayerAnimStates.WALK));
    });

    this.app.on('player:walkback', () => this.modelHandler.updateAnimation(animLayers.BASE, baselayerAnimStates.WALKBACK), this);
    this.on('destroy', function () {
        this.app.off('player:walkback', () => this.modelHandler.updateAnimation(animLayers.BASE, baselayerAnimStates.WALKBACK));
    });

    this.app.on('player:turnleft', () => this.modelHandler.updateAnimation(animLayers.BASE, baselayerAnimStates.TURNLEFT), this);
    this.on('destroy', function () {
        this.app.off('player:turnleft', () => this.modelHandler.updateAnimation(animLayers.BASE, baselayerAnimStates.TURNLEFT));
    });

    this.app.on('player:turnright', () => this.modelHandler.updateAnimation(animLayers.BASE, baselayerAnimStates.TURNRIGHT), this);
    this.on('destroy', function () {
        this.app.off('player:turnright', () => this.modelHandler.updateAnimation(animLayers.BASE, baselayerAnimStates.TURNRIGHT));
    });

    this.app.on('player:idle', () => this.modelHandler.updateAnimation(animLayers.BASE, baselayerAnimStates.IDLE), this);
    this.on('destroy', function () {
        this.app.off('player:idle', () => this.modelHandler.updateAnimation(animLayers.BASE, baselayerAnimStates.IDLE));
    });

    this.app.on('player:dance', () => this.modelHandler.updateAnimation(animLayers.BASE, baselayerAnimStates.DANCE), this);
    this.on('destroy', function () {
        this.app.off('player:dance', () => this.modelHandler.updateAnimation(animLayers.BASE, baselayerAnimStates.DANCE));
    });

    this.app.on('player:exit', () => this.modelHandler.updateAnimation(animLayers.BASE, baselayerAnimStates.EXIT), this);
    this.on('destroy', function () {
        this.app.off('player:exit', () => this.modelHandler.updateAnimation(animLayers.BASE, baselayerAnimStates.Exit));
    });

    // Upper Body Layer

    this.app.on('player:wavestart', () => this.modelHandler.updateAnimation(animLayers.UPPERBODY, upperbodyAnimStates.WAVESTART), this);
    this.on('destroy', function () {
        this.app.off('player:wavestart', () => this.modelHandler.updateAnimation(animLayers.UPPERBODY, upperbodyAnimStates.WAVESTART));
    });

    this.app.on('player:wavestop', () => this.modelHandler.updateAnimation(animLayers.UPPERBODY, upperbodyAnimStates.WAVESTOP), this);
    this.on('destroy', function () {
        this.app.off('player:wavestop', () => this.modelHandler.updateAnimation(animLayers.UPPERBODY, upperbodyAnimStates.WAVESTOP));
    });
};

AnimationHandler.prototype.initTFJS = function () {
    console.log("Initializing Hand Pose tracking");
    var self = this;
    self.state = "idle";
    self.video = document.querySelector("video");
    self.videoPlaying = false;

    //TODO only create one SRC canvas for both face and hand detection
    self.canvas = document.createElement('canvas');
    self.ctx = self.canvas.getContext('2d');

    // creat webworker
    self.workerScript = this.app.assets.find(self.workerFileName);
    self.worker = new Worker(self.workerScript.getFileUrl());

    self.video.addEventListener('play', function () {
        videoPlaying = true;
        // listen to worker if any message is there
        self.worker.addEventListener("message", (event) => {
            // read the incoming data
            const data = event.data;
            if (data === "wave") {
                if (self.state != "waving") {
                    //self.playerEntity.animation.play("Wave.glb", 0.2);
                    //self.state = "waving";
                }
            } else {
                if (self.state != "idle") {
                    //self.playerEntity.animation.play("idle.glb", 0.2);
                    //self.state = "idle";
                }
            }
            console.log(data);
            self.processFrame();
        });
        self.processFrame();
    }, false);
};

// update code called every frame
AnimationHandler.prototype.update = function (dt) {

};