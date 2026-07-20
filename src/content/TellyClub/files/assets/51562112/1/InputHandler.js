var InputHandler = pc.createScript('inputHandler');

InputHandler.attributes.add('cameraEntity', { type: 'entity', title: 'Camera Entity' });
InputHandler.attributes.add('cameraTarget', { type: 'entity', title: 'Camera Target' });
InputHandler.attributes.add('playerEntity', { type: 'entity', title: 'Player Entity' });
InputHandler.attributes.add('rayTargetIndicator', { type: 'entity', title: 'Ray Target Entity' });
InputHandler.attributes.add('alignIndicator', {
    title: 'Align Indicator',
    description: 'Align Indicator with Ray Normal',
    type: 'boolean',
    default: false
});

InputHandler.attributes.add('pathfindingTag', {
    title: 'Pathfinding Tag',
    type: 'string'
});

InputHandler.attributes.add('raycastBlockers', {
    title: 'Raycast Blocking Tags',
    type: 'string',
    array: true
});

InputHandler.attributes.add('clickTimeThreshold', { type: 'number', title: 'Click Time Threshold' });

InputHandler.attributes.add('rotationMultiplier', {
    type: 'number',
    title: 'Y Rotation Multiplier',
    default: 0.2
});

// initialize code called once per entity
InputHandler.prototype.initialize = function () {
    var self = this;
    InputHandler.instance = this;
    this.playerController = this.playerEntity.script.get("playerController");

    this.timeDelta = 0;
    this.pointerDown = false;
    this.pointerStartPos = new pc.Vec2();
    this.pointerPos = new pc.Vec2();
    this.indicatorMaterial = this.rayTargetIndicator.model.meshInstances[0].material;

    this.keysHeld = {};

    // Listen for when the mouse travels out of the window
    document.body.addEventListener('mouseleave', self.onMouseLeave);
    document.body.addEventListener('mouseenter', self.onMouseEnter);

    // Listen for when the app gains and loses focus
    window.addEventListener('blur', self.onBlur);
    //    window.addEventListener('focus', self.onFocus);

    this.on('destroy', function () {
        document.body.removeEventListener('mouseleave', self.onMouseLeave);
        document.body.removeEventListener('mouseenter', self.onMouseEnter);
        window.removeEventListener('blur', self.onBlur);
        //        window.removeEventListener('focus', self.onFocus);
    });
};

InputHandler.newPosition = new pc.Vec3();

InputHandler.prototype.registerForEvents = function () {
    // Register the mouse down and touch start event so we know when the user has clicked.
    // Called from tubeEntranceHandler to keep pathfinding code disabled during intro sequence.
    this.app.mouse.on(pc.EVENT_MOUSEDOWN, this.onMouseDown, this);
    this.app.mouse.on(pc.EVENT_MOUSEUP, this.onMouseUp, this);
    this.app.mouse.on(pc.EVENT_MOUSEMOVE, this.onMouseMove, this);

    this.app.keyboard.on(pc.EVENT_KEYDOWN, this.onKeyDown, this);
    this.app.keyboard.on(pc.EVENT_KEYUP, this.onKeyUp, this);

    if (this.app.touch) {
        this.app.touch.on(pc.EVENT_TOUCHSTART, this.onTouchStart, this);
        this.app.touch.on(pc.EVENT_TOUCHEND, this.onTouchEnd, this);
        this.app.touch.on(pc.EVENT_TOUCHMOVE, this.onTouchMove, this);
    }
};

InputHandler.prototype.update = function (dt) {
    if (this.pointerDown) {
        this.timeDelta += dt;
    }
};

InputHandler.prototype.onKeyDown = function (event) {
    if (this.app.exiting === true || this.keysHeld[event.key]) return;
    switch (event.key) {
        case pc.KEY_W:
        case pc.KEY_UP:
            this.playerController.setDirectControl('forward', true);
            break;
        case pc.KEY_S:
        case pc.KEY_DOWN:
            this.playerController.setDirectControl('backward', true);
            break;
        case pc.KEY_A:
        case pc.KEY_LEFT:
            this.playerController.setDirectControl('left', true);
            break;
        case pc.KEY_D:
        case pc.KEY_RIGHT:
            this.playerController.setDirectControl('right', true);
            break;
    }
    this.keysHeld[event.key] = true;
};

InputHandler.prototype.onKeyUp = function (event) {
    switch (event.key) {
        case pc.KEY_W:
        case pc.KEY_UP:
            this.playerController.setDirectControl('forward', false);
            break;
        case pc.KEY_S:
        case pc.KEY_DOWN:
            this.playerController.setDirectControl('backward', false);
            break;
        case pc.KEY_A:
        case pc.KEY_LEFT:
            this.playerController.setDirectControl('left', false);
            break;
        case pc.KEY_D:
        case pc.KEY_RIGHT:
            this.playerController.setDirectControl('right', false);
            break;
    }
    this.keysHeld[event.key] = false;
    if (!Object.values(this.keysHeld).includes(true)) {
        this.playerController.resetDirectControl();
    }
};

InputHandler.prototype.resetKeysHeld = function (event) {
    //this.keysHeld = {};
    for (var k in this.keysHeld) {
        delete this.keysHeld[k];
    }
};

InputHandler.prototype.onMouseDown = function (event) {
    if (event.button == pc.MOUSEBUTTON_LEFT) {
        this.handleMouseDown(event);
    } else {
        this.resetKeysHeld();

        this.playerController.resetDirectControl();
    }
};

InputHandler.prototype.handleMouseDown = function (event) {
    this.pointerDown = true;
    this.pointerStartPos.x = event.x;
    this.pointerStartPos.y = event.y;
    this.pointerPos = this.pointerStartPos.clone();
};

InputHandler.prototype.onMouseUp = function (event) {
    if (event.button == pc.MOUSEBUTTON_LEFT) {
        if (this.app.exiting !== true && this.timeDelta < this.clickTimeThreshold && !this.playerController.hasDirectControl && !Joystick.joysticking)
            this.doRayCast(this.pointerStartPos);
        this.handleMouseUp();
    }
};

InputHandler.prototype.handleMouseUp = function () {
    this.pointerDown = false;
    this.timeDelta = 0;
};

InputHandler.prototype.onMouseMove = function (event) {
    this.mouseIsMoving = true;
    clearTimeout(this.mouseIsMoving);
    this.playerController.directControlForwardMovementTimer = 0;
    this.mouseTimeOut = setTimeout(() => this.mouseIsMoving = false, this.playerController.timeToFollow * 1000);
    if ((this.pointerDown && !Joystick.joysticking)) {//|| this.playerController.hasDirectControl) {
        this.cameraTarget.script.cameraHandler.updateYRotGoal(-event.dx * this.rotationMultiplier);
        this.cameraTarget.script.cameraHandler.updateXRotGoal(event.dy);
        this.cameraTarget.script.cameraHandler.isFollowing = false;
    }
};

InputHandler.prototype.onMouseLeave = function (event) {
    InputHandler.instance.handleMouseUp();
};

InputHandler.prototype.onMouseEnter = function (event) {
    // if (InputHandler.instance.app.mouse.isPressed(pc.MOUSEBUTTON_LEFT))
    //     InputHandler.instance.handleMouseDown();
};

// InputHandler.prototype.onFocus = function (event) {
//     
// };

InputHandler.prototype.onBlur = function (event) {
    InputHandler.instance.resetKeysHeld();
    InputHandler.instance.resetDirectControl();
};

InputHandler.prototype.resetDirectControl = function (event) {
    this.playerController.resetDirectControl();
};

InputHandler.prototype.onTouchStart = function (event) {
    if (this.app.exiting === true) return;

    // Only perform the raycast logic if the user has one finger on the screen
    this.pointerDown = true;
    if (event.touches.length == 1) {
        this.pointerStartPos.x = event.touches[0].x;
        this.pointerStartPos.y = event.touches[0].y;
        this.pointerPos = this.pointerStartPos.clone();
    }
    event.event.preventDefault();
};

InputHandler.prototype.onTouchEnd = function (event) {
    if (this.app.exiting === true) return;
    if (event.touches.length === 0) {
        if (this.timeDelta < this.clickTimeThreshold) {
            this.doRayCast(this.pointerStartPos);
        }
        this.timeDelta = 0;
        this.pointerDown = false;
    }
};

InputHandler.prototype.onTouchMove = function (event) {
    // Only perform the raycast logic if the user has one finger on the screen
    if (this.pointerDown && event.touches.length === 1 && !Joystick.joysticking) {
        var deltaX = this.pointerPos.x - event.touches[0].x;
        var deltaY = this.pointerPos.y - event.touches[0].y;
        this.cameraTarget.script.cameraHandler.updateYRotGoal(deltaX * this.rotationMultiplier);
        this.cameraTarget.script.cameraHandler.updateXRotGoal(deltaY);
        this.cameraTarget.script.cameraHandler.isFollowing = false;
        this.pointerPos.x = event.touches[0].x;
        this.pointerPos.y = event.touches[0].y;
    }
};

InputHandler.ray = new pc.Ray();
InputHandler.hitPosition = new pc.Vec3();

InputHandler.prototype.doRayCast = function (screenPosition) {
    var self = this;
    // The pc.Vec3 to raycast from (the position of the camera)
    var from = this.cameraEntity.getPosition();
    // The pc.Vec3 to raycast to (the click position projected onto the camera's far clip plane)
    var to = this.cameraEntity.camera.screenToWorld(screenPosition.x, screenPosition.y, this.cameraEntity.camera.farClip);

    // Raycast between the two points and return first result for blocking raycast on ignore layers
    var result = this.app.systems.rigidbody.raycastFirst(from, to);
    for (let i = 0; i < this.raycastBlockers.length; i++) {
        if (result && result.entity.tags.has(this.raycastBlockers[i])) {
            return;
        }
    }

    // Raycast between the two points and return all hit results for pathfinding purposes
    var results = this.app.systems.rigidbody.raycastAll(from, to);
    if (results && results.length > 0) {
        for (var i = 0; i < results.length; i++) {
            if (results[i].entity.tags.has(this.pathfindingTag)) {
                if (results[i].normal.y > 0) {
                    this.app.fire('player:target', results[i].point);
                    this.rayTargetIndicator.parent.setPosition(results[i].point.x, results[i].point.y + 0.01, results[i].point.z);

                    var mat = this.indicatorMaterial;
                    var data = { opacity: 1 };
                    mat.opacity = data.opacity;
                    mat.update();
                    this.app.tween(data).to({ opacity: 0.0 }, 1.0, pc.Linear).start().on("update", () => { mat.opacity = data.opacity; mat.update(); });

                    if (this.alignIndicator) {
                        var m = new pc.Mat4();
                        var r = new pc.Quat();
                        // Make the hit entity point in the direction of the hit normal
                        setMat4Forward(m, result.normal, pc.Vec3.UP);
                        r.setFromMat4(m);
                        this.rayTargetIndicator.parent.setRotation(r);
                    } else {
                        this.rayTargetIndicator.setRotation(pc.Quat.ZERO);
                    }
                }
                return;
            }
        }
    }
};

var setMat4Forward = (function () {
    var x, y, z;

    x = new pc.Vec3();
    y = new pc.Vec3();
    z = new pc.Vec3();

    return function (mat4, forward, up) {
        // Inverse the forward direction as +z is pointing backwards due to the coordinate system
        z.copy(forward).scale(-1);
        y.copy(up).normalize();
        x.cross(y, z).normalize();
        y.cross(z, x);

        var r = mat4.data;

        r[0] = x.x;
        r[1] = x.y;
        r[2] = x.z;
        r[3] = 0;
        r[4] = y.x;
        r[5] = y.y;
        r[6] = y.z;
        r[7] = 0;
        r[8] = z.x;
        r[9] = z.y;
        r[10] = z.z;
        r[11] = 0;
        r[15] = 1;

        return mat4;
    };
}());