var TubeEntranceHandler = pc.createScript('tubeEntranceHandler');

TubeEntranceHandler.attributes.add("player", { type: "entity", title: "Player Entity" });
TubeEntranceHandler.attributes.add("cameraTarget", { type: "entity", title: "Camera Target Entity" });
TubeEntranceHandler.attributes.add("tubeIris", { type: "entity", title: "Tube Iris" });
TubeEntranceHandler.attributes.add("slotsGroup", { type: "entity", title: "Slots Group" });
TubeEntranceHandler.attributes.add("tubeParticles", { type: "entity", title: "Tube Particles" });
TubeEntranceHandler.attributes.add("positionCurve", { type: "curve", title: "Position Curve", curves: ['x', 'y', 'z'] });
TubeEntranceHandler.attributes.add("scaleCurve", { type: "curve", title: "Scale Curve", curves: ['x', 'y', 'z'] });
TubeEntranceHandler.attributes.add("duration", { type: "number", default: 3, title: "Duration (secs)" });

// initialize code called once per entity
TubeEntranceHandler.prototype.initialize = function () {
    this.isAnimating = false;
    this.model = this.player.script.modelHandler.model;
    this.startScale = this.model.getLocalScale().clone();
    this.position = this.model.getLocalPosition().clone();
    this.scale = new pc.Vec3();
    this.time = 0;

    var slots = this.slotsGroup.children;
    this.slot = slots[Math.floor(Math.random() * slots.length)];

    this.app.on("tubeEntrance:networkedPlayer", this.squashAndStretch, this);
    this.app.on("destroy", () => {
        this.app.off("tubeEntrance:networkedPlayer", this.squashAndStretch, this);
    });

    this.app.tween({}).to({}, 1, pc.Linear).start().on('complete', this.doIris, this);
    this.app.tween({}).to({}, 1.25, pc.Linear).start().on('complete', this.doParticles, this);
    this.app.tween({}).to({}, 1.5, pc.Linear).start().on('complete', this.doEntrance, this);
};

TubeEntranceHandler.prototype.postInitialize = function () {
    this.player.script.inputHandler.enabled = false;
    this.player.script.playerController.enabled = false;
    this.cameraTarget.script.cameraHandler.enabled = false;
};

TubeEntranceHandler.prototype.doIris = function () {
    this.tubeIris.animation.speed = 1;
    this.tubeIris.animation.play("iris.glb");
    this.app.tween({}).to({}, 0.75, pc.Linear).start().on('complete', () => { this.tubeIris.animation.speed = -2; }, this);
};

TubeEntranceHandler.prototype.doParticles = function () {
    this.app.fire("sceneChange:tubeEntrance");
    this.tubeParticles.particlesystem.reset();
    this.tubeParticles.particlesystem.play();
};

TubeEntranceHandler.prototype.doEntrance = function () {
    var time = 0.0;
    var animTween = this.app.tween({}).to({}, this.duration, pc.Linear);
    animTween.on('update', function (dt) {
        time += dt;
        var percent = time / this.duration;
        var scaleCurveValue = this.scaleCurve.value(percent);
        var positionCurveValue = this.positionCurve.value(percent);

        this.scale.copy(this.startScale);
        this.scale.x += scaleCurveValue[0];
        this.scale.y += scaleCurveValue[1];
        this.scale.z += scaleCurveValue[2];
        this.model.setLocalScale(this.scale);

        this.position.x = positionCurveValue[0];
        this.position.y = positionCurveValue[1];
        this.position.z = positionCurveValue[2];
        this.player.setLocalPosition(this.position);
    }, this);
    animTween.on('complete', this.doEntranceFinish, this);
    animTween.start();
};

TubeEntranceHandler.prototype.doEntranceFinish = function () {
    this.model.tween({}).to({}, 0.75, pc.Linear).start().on('complete',
        function () {
            this.player.script.playerController.enabled = true;
            this.player.script.playerController.onNewTarget(this.slot.getPosition());
            this.player.script.inputHandler.enabled = true;
            this.player.script.inputHandler.registerForEvents();
            this.cameraTarget.script.cameraHandler.enabled = true;
        }, this);
};

TubeEntranceHandler.prototype.squashAndStretch = function (model) {
    this.app.tween({}).to({}, 0.5, pc.Linear).start().on('complete', () => {
        this.tubeIris.animation.speed = 1;
        this.tubeIris.animation.play("iris.glb");
    }, this);
    this.app.tween({}).to({}, 1.5, pc.Linear).start().on('complete', () => { this.tubeIris.animation.speed = -2; }, this);

    var time = 0.0;
    var currentScale = new pc.Vec3();
    var startScale = model.getLocalScale().clone();
    var scaleTween = this.app.tween({}).to({}, this.duration, pc.Linear);
    scaleTween.on('update', function (dt) {
        time += dt;
        var percent = time / this.duration;
        var scaleCurveValue = this.scaleCurve.value(percent);
        currentScale.copy(startScale);
        currentScale.x += scaleCurveValue[0];
        currentScale.y += scaleCurveValue[1];
        currentScale.z += scaleCurveValue[2];
        model.setLocalScale(currentScale);
    }, this);
    scaleTween.delay(1.25);
    scaleTween.start();
};

// update code called every frame
TubeEntranceHandler.prototype.update = function (dt) {

};
