var Raycaster = pc.createScript('raycaster');

Raycaster.attributes.add('raycastEvent', {
    title: 'Raycast Event Name',
    description: 'Event to fire on object hit by raycast.',
    type: 'string'
});

Raycaster.attributes.add("clickTimeout", {
    title: "Click Timeout",
    description: "Time between down and up after it's not considered a click.",
    type: "number",
    default: 0.5
});

// initialize code called once per entity
Raycaster.prototype.initialize = function () {
    this.down = false;
    this.app.mouse.on(pc.EVENT_MOUSEUP, this.onMouseUp, this);
    this.app.mouse.on(pc.EVENT_MOUSEDOWN, this.onMouseDown, this);
    this.entity.on('destroy', () => {
        this.app.mouse.off(pc.EVENT_MOUSEUP, this.onMouseUp, this);
        this.app.mouse.off(pc.EVENT_MOUSEDOWN, this.onMouseDown, this);
    });

    if (this.app.touch) {
        this.app.touch.on(pc.EVENT_TOUCHSTART, this.onTouchStart, this);
        this.app.touch.on(pc.EVENT_TOUCHEND, this.onTouchEnd, this);
        this.entity.on('destroy', () => {
            this.app.touch.off(pc.EVENT_TOUCHSTART, this.onTouchStart, this);
            this.app.touch.off(pc.EVENT_TOUCHEND, this.onTouchEnd, this);
        });
    }
};

Raycaster.prototype.onMouseDown = function (e) {
    if (e.button == pc.MOUSEBUTTON_LEFT) {
        this.down = true;
        this.timer = setTimeout(() => { this.down = false; }, this.clickTimeout * 1000);
    }
};

Raycaster.prototype.onMouseUp = function (e) {
    console.log("Mouse Up");
    if (e.button == pc.MOUSEBUTTON_LEFT && this.down) {
        this.doRaycast(e.x, e.y);
        console.log("click");
    }
};

Raycaster.prototype.onTouchStart = function (event) {
    // Only perform the raycast logic if the user has one finger on the screen
    if (event.touches.length == 1 && this.entity.script.enabled) {
        this.down = true;
        this.screenPos = event.touches[0];
        this.timer = setTimeout(() => this.down = false, this.clickTimeout * 1000);
    }
    event.event.preventDefault();
};

Raycaster.prototype.onTouchEnd = function (event) {
    if (event.touches.length == 0 && this.down) {
        this.doRaycast(this.screenPos.x, this.screenPos.y);
        this.screenPos = undefined;
    }
    event.event.preventDefault();
};

Raycaster.prototype.doRaycast = function (x, y) {
    console.log("Raycasting");
    var from = this.entity.camera.screenToWorld(x, y, this.entity.camera.nearClip);
    var to = this.entity.camera.screenToWorld(x, y, this.entity.camera.farClip);

    var result = this.app.systems.rigidbody.raycastFirst(from, to);
    if (result) {
        result.entity.fire(this.raycastEvent);
    }
};
// swap method called for script hot-reloading
// inherit your script state here
// Raycaster.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// https://developer.playcanvas.com/en/user-manual/scripting/