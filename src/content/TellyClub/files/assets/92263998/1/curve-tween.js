var CurveTween = pc.createScript('curveTween');

CurveTween.attributes.add("animCurve", {
    type: "curve"
});

CurveTween.attributes.add("triggerEvent", {
    title: "Triggering Event",
    type: "string",
    default: "curve:start"
});

CurveTween.attributes.add("updateEvent", {
    title: "On Update Event",
    description: "Event that is fired on each curve update.",
    type: "string",
    default: "curve:update"
});

CurveTween.attributes.add("duration", {
    type: "number",
    default: 1
});

// initialize code called once per entity
CurveTween.prototype.initialize = function () {

    this.entity.on(this.triggerEvent, () => {
        console.log("Trigger!");
        let progress = {
            pos: 0
        };
        this.app.tween(progress).to({ pos: 1 }, this.duration, pc.Linear).start().on('update', function () {
            console.log(this.animCurve.value(progress.pos));
            this.entity.fire(this.updateEvent, this.animCurve.value(progress.pos));
        }, this);
    }, this);
};

// update code called every frame
CurveTween.prototype.update = function (dt) {

};

// swap method called for script hot-reloading
// inherit your script state here
// CurveTween.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// https://developer.playcanvas.com/en/user-manual/scripting/