var UiHoverEvent = pc.createScript('uiHoverEvent');


UiHoverEvent.attributes.add("enterEvent", {
    type: "string",
    title: "Enter Event Name"
});

UiHoverEvent.attributes.add("leaveEvent", {
    type: "string",
    title: "Leave Event Name"
});

UiHoverEvent.attributes.add("localEvent", {
    type: "boolean",
    title: "Local Event"
});

// initialize code called once per entity
UiHoverEvent.prototype.initialize = function () {
    this.target = this.localEvent ? this.entity : this.app;
    this.entity.element.on("mouseenter", () => {
        this.target.fire(this.enterEvent);
        //console.log("enter");
    }, this);
    this.entity.element.on("mouseleave", () => {
        this.target.fire(this.leaveEvent);
        //console.log("leave");
    }, this);
};

// update code called every frame
UiHoverEvent.prototype.update = function (dt) {

};

// swap method called for script hot-reloading
// inherit your script state here
// UiHoverEvent.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// https://developer.playcanvas.com/en/user-manual/scripting/