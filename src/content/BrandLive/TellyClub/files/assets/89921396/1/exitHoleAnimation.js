var ExitHoleAnimation = pc.createScript('exitHoleAnimation');
ExitHoleAnimation.attributes.add("targetEntity", {
    type: "entity"
});

// initialize code called once per entity
ExitHoleAnimation.prototype.initialize = function () {
    const target = this.targetEntity ? this.targetEntity : this.app;

    target.anim.on('hole:start', this.animateIn, this);
    target.anim.on('hole:end', this.animateOut, this);
    this.currentTween = undefined;
};

ExitHoleAnimation.prototype.animateIn = function () {
    if (this.currentTween != undefined)
        this.currentTween.stop();
    this.currentTween = this.entity
        .tween(this.entity.getLocalScale())
        .to(new pc.Vec3(1, 1, 1), 1.0, pc.ElasticOut);

    this.currentTween.start();
};

ExitHoleAnimation.prototype.animateOut = function () {
    if (this.currentTween != undefined)
        this.currentTween.stop();
    this.currentTween = this.entity
        .tween(this.entity.getLocalScale())
        .to(new pc.Vec3(0, 0, 0), 0.5, pc.ExponentialIn);
    this.currentTween.start();
};

// update code called every frame
ExitHoleAnimation.prototype.update = function (dt) {

};

// swap method called for script hot-reloading
// inherit your script state here
// ExitHoleAnimation.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// https://developer.playcanvas.com/en/user-manual/scripting/