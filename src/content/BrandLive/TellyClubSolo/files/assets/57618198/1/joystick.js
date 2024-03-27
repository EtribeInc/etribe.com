var Joystick = pc.createScript('joystick');

Joystick.attributes.add('playerEntity', { type: 'entity', title: 'Player Entity' });
Joystick.attributes.add('circle', { type: 'entity', title: 'Circle Entity' });
Joystick.attributes.add('dot', { type: 'entity', title: 'Dot Entity' });
Joystick.attributes.add('deadZoneRadius', { type: 'number', title: 'Dead Zone Radius', default: 16 });
Joystick.attributes.add('mouseDebug', { type: 'boolean', title: 'Mouse Debug', default: false });
Joystick.attributes.add('uiBinderEntity', { type: 'entity', title: 'UI Binder Entity' });

// initialize code called once per entity
Joystick.prototype.initialize = function () {

    this.uiBinderEntity.on('ui:set-up', () => this.init(), this);

};

Joystick.prototype.init = function () {
    let controller = document.getElementById('controller-wrapper');
    console.log(controller);

    controller.addEventListener('stickStart', () => this.onHandleDragStart());

    controller.addEventListener('stickMove', (event) => this.onHandleDrag(event));

    controller.addEventListener('stickEnd', () => this.onHandleDragEnd());

    this.playerController = this.playerEntity.script.get("playerController");
};

Joystick.joysticking = false;

Joystick.prototype.onHandleDragStart = function () {
    console.log("Got drag start event!");
    Joystick.joysticking = true;
};

Joystick.prototype.onHandleDrag = function (event) {
    var dx = event.detail.x;
    var dy = event.detail.y;
    var distance = Math.sqrt((dx * dx) + (dy * dy));

    if (distance < this.deadZoneRadius) {
        this.playerController.resetDirectControl();
        this.app.fire('player:idle');
        return;
    }
    const angle = Math.atan2(dy, dx);
    this.setDirectControl(angle);
};

Joystick.prototype.onHandleDragEnd = function () {
    console.log("Got drag end event!");
    Joystick.joysticking = false;
    this.app.fire('player:idle');
    this.playerController.resetDirectControl();
};

// update code called every frame
Joystick.prototype.update = function (dt) {

};

Joystick.prototype.setDirectControl = function (angle) {
    this.playerController.resetDirectControl();
    switch (true) {
        case angle <= -15 * Math.PI / 16:
            this.playerController.setDirectControl('left', true);
            break;
        case angle > -15 * Math.PI / 16 && angle <= -5 * Math.PI / 8:
            this.playerController.setDirectControl('left', true);
            this.playerController.setDirectControl('forward', true);
            break;
        case angle > -5 * Math.PI / 8 && angle <= -3 * Math.PI / 8:
            this.playerController.setDirectControl('forward', true);
            break;
        case angle > -3 * Math.PI / 8 && angle <= -Math.PI / 16:
            this.playerController.setDirectControl('forward', true);
            this.playerController.setDirectControl('right', true);
            break;
        case angle > -Math.PI / 16 && angle <= Math.PI / 16:
            this.playerController.setDirectControl('right', true);
            break;
        case angle > Math.PI / 16 && angle <= 3 * Math.PI / 8:
            this.playerController.setDirectControl('right', true);
            this.playerController.setDirectControl('backward', true);
            break;
        case angle > 3 * Math.PI / 8 && angle <= 5 * Math.PI / 8:
            this.playerController.setDirectControl('backward', true);
            break;
        case angle > 5 * Math.PI / 8 && angle <= 15 * Math.PI / 16:
            this.playerController.setDirectControl('backward', true);
            this.playerController.setDirectControl('left', true);
            break;
        case angle > 15 * Math.PI / 16:
            this.playerController.setDirectControl('left', true);
            break;
        default:
            break;
    }
};
