var TubeExitHandler = pc.createScript('tubeExitHandler');

TubeExitHandler.attributes.add("tubeObject", { type: "entity", title: "Tube Object" });
TubeExitHandler.attributes.add("tubeParticles", { type: "entity", title: "Tube Particles" });

TubeExitHandler.attributes.add("scaleCurve", { type: "curve", title: "Scale Curve", curves: ['x', 'y', 'z'] });
TubeExitHandler.attributes.add("duration", { type: "number", default: 3, title: "Duration (secs)" });

// initialize code called once per entity
TubeExitHandler.prototype.initialize = function () {
    this.isAnimating = false;
    this.doTellyAnimation = false;

    this.app.on('tubeExitHandler:start', () => {
        console.log("Exiting Tube..");
        if (!this.isAnimating) { this.doTubeAnimation(); }
    }, this);
    this.on('destroy', function () {
        this.app.off(() => { if (!this.isAnimating) { this.doTubeAnimation(); } }, this);
    });
};

TubeExitHandler.prototype.doTubeAnimation = function () {
    this.model = this.entity.script.modelHandler.model;
    this.startScale = this.model.getLocalScale().clone();
    this.scale = new pc.Vec3();

    this.time = 0.0;
    this.isAnimating = true;
    this.tubeObject.animation.enabled = true;
    this.tubeObject.animation.play('Tube.glb');

    // using a null tween as a delay
    this.app.tween({}).to({}, 1.25, pc.Linear).start().on('complete',
        function () {
            this.doTellyAnimation = true;
            this.tubeParticles.particlesystem.reset();
            this.tubeParticles.particlesystem.play();
        }, this);
};

TubeExitHandler.prototype.update = function (dt) {
    if (!this.doTellyAnimation) return;

    this.time += dt;
    var percent = this.time / this.duration;
    var curveValue = this.scaleCurve.value(percent);

    this.scale.copy(this.startScale);
    this.scale.x += curveValue[0];
    this.scale.y += curveValue[1];
    this.scale.z += curveValue[2];

    this.model.setLocalScale(this.scale);

    if (this.time > 2.5) {
        this.entity.script.modelHandler.updateAnimation(animLayers.UPPERBODY, upperbodyAnimStates.WAVESTART);
    }

    if (this.time > this.duration) {
        this.doTellyAnimation = false;
        this.model.tween(this.model.getLocalPosition()).to({ x: 0, y: 3, z: 0 }, 0.15, pc.Linear).start().on('complete',
            function () {
                this.app.fire('sceneChange:doFade');
            }, this);
    }
};

TubeExitHandler.prototype.wave = function (telly) {
    telly.anim.setBoolean("Backward", false);
    telly.anim.setBoolean("Forward", false);
    telly.anim.setBoolean("Wave", true);
    telly.anim.setBoolean("Dance", false);
    telly.anim.setBoolean("ForceDance", false);
};