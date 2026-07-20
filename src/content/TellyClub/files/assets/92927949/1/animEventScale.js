var AnimEventDisableModel = pc.createScript('animEventDisableModel');

AnimEventDisableModel.attributes.add("disableEvent", {
    type: "string"
});

// initialize code called once per entity
AnimEventDisableModel.prototype.initialize = function () {
    if (this.entity.anim) {
        this.entity.anim.on(this.disableEvent, () => {
            this.entity.model.enabled = false;
        }, this);
    }
};

// update code called every frame
AnimEventDisableModel.prototype.update = function (dt) {

};

// swap method called for script hot-reloading
// inherit your script state here
// AnimEventScale.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// https://developer.playcanvas.com/en/user-manual/scripting/