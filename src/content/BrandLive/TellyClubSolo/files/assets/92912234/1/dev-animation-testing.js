var DevAnimationTesting = pc.createScript('devAnimationTesting');

DevAnimationTesting.attributes.add("models", {
    type: "entity",
    array: true
});

DevAnimationTesting.attributes.add("animations", {
    type: "string",
    array: true
});

// initialize code called once per entity
DevAnimationTesting.prototype.initialize = function () {
    console.log(this.animations);
    this.animations.forEach((anim) => {
        this.models.forEach((model) => {
            model.soundSrc = model.findComponent("sound");
            console.log("Setting listener to anim event: " + anim);
            model.anim.on(anim, () => {
                console.log("Anim event: " + anim);
                model.soundSrc.play(anim);
            });
        });

        this.app.on("devAnim:" + anim, () => {
            console.log("Event: devAnim:" + anim);
            this.models.forEach((model) => {
                model.model.enabled = true;
                this.resetAnims(model);
                console.log("Setting Boolean " + anim);
                model.anim.setBoolean(anim, true);
            }, this);
        }, this);
    }, this);
    this.app.on("devAnim:Reset", () => {
        this.models.forEach((model) => {
            model.model.enabled = true;
            this.resetAnims(model);
            //model.anim.reset();
        }, this);
    });
};

DevAnimationTesting.prototype.resetAnims = function (model) {
    this.animations.forEach((anim) => {
        model.anim.setBoolean(anim, false);
    }, this);
};

// update code called every frame
DevAnimationTesting.prototype.update = function (dt) {
};

// swap method called for script hot-reloading
// inherit your script state here
// DevAnimationTesting.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// https://developer.playcanvas.com/en/user-manual/scripting/