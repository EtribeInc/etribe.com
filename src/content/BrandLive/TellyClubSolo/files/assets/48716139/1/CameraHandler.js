var CameraHandler = pc.createScript('cameraHandler');

CameraHandler.attributes.add('camera', { type: 'entity', title: 'Camera' });
CameraHandler.attributes.add('followTarget', { type: 'entity', title: 'Follow Target' });
CameraHandler.attributes.add('inertiaFactorMouse', {
    type: 'number',
    default: 0.2,
    min: 0.1,
    max: 0.5,
    title: 'Inertia Factor for Mouse'
});
CameraHandler.attributes.add('inertiaFactorFollow', {
    type: 'number',
    default: 0.35,
    min: 0.1,
    max: 0.5,
    title: 'Inertia Factor for Follow'
});
CameraHandler.attributes.add('verticalLookMin', { type: 'number', title: 'Vertical Look Min' });
CameraHandler.attributes.add('verticalLookMax', { type: 'number', title: 'Vertical Look Max' });
CameraHandler.attributes.add('verticalLookDefault', {
    type: 'number',
    title: 'Vertical Look Default',
    default: -14
});
CameraHandler.attributes.add('surfaceOffset', {
    type: 'number',
    default: 0.1,
    min: 0,
    max: 0.5,
    title: 'Distance along surface normal to offset for camera avoidance'
});
CameraHandler.attributes.add('verticalOffset', {
    type: 'number',
    default: 1,
    min: 0,
    max: 2,
    title: 'Distance above floor to move camera towards during camera avoidance'
});

CameraHandler.attributes.add('defaultPosEntity', { type: 'entity', title: 'Default Camera Pos' });
CameraHandler.attributes.add('convoPosEntity', { type: 'entity', title: 'Convo Camera Pos' });
CameraHandler.attributes.add('convoActive', { type: 'boolean', title: 'Conversation Mode Active' });

// initialize code called once per entity
CameraHandler.prototype.initialize = function () {
    var self = this;

    this.defaultRotation = this.camera.getLocalRotation().clone();

    this.pos = this.entity.getPosition().clone();
    this.cameraTargetRot = new pc.Quat();
    this.cameraPivotRot = this.camera.parent.getLocalRotation().clone();
    this.defaultOffsetFromPivot = this.camera.parent.getLocalPosition().clone();
    this.offset = new pc.Vec3(0, this.verticalOffset, 0);
    this.xRotGoal = this.verticalLookDefault;
    this.yRotGoal = 0.0;
    this.isFollowing = true;

    //Convo vars
    this.cameraTargetPos = this.camera.getLocalPosition().clone();
    this.convoLerpTime = 0.0;
    this.convoRotXFrom = this.camera.parent.getLocalEulerAngles().x;
    this.convoEngageFromRot = new pc.Quat();
    this.convoReleasing = false;
    this.convoEngaging = false;

    this.app.on("convoCondition", (bool) => {
        this.convoRotXFrom = this.camera.parent.getLocalEulerAngles().x;
        this.convoEngageFromRot = this.entity.getRotation();
        self.convoActive = bool;
        this.convoEngaging = bool;
        this.convoReleasing = !bool;
        this.convoLerpTime = 0.0;
    }, this);

    this.app.on("camera:custom-pose", (p, r) => {
        this.customPose = true;
        this.customPosition = p;
        this.customRotation = r;

        var pos = this.camera.getPosition().clone();
        var rot = this.camera.getRotation().clone();

        var posTween = this.app.tween(pos).to(this.customPosition, 1, pc.SineInOut);
        posTween.on('update', function () {
            this.camera.setPosition(pos);
        }, this);
        posTween.start();

        var rotTween = this.app.tween(rot).to(this.customRotation, 1, pc.SineInOut);
        rotTween.on('update', function () {
            this.camera.setRotation(rot);
        }, this);
        rotTween.start();
    }, this);

    this.app.on("camera:clear-pose", () => {
        if (this.customPose) {
            console.log("Leaving custom camera pose. Reenabling camera controls.");
            this.camera.tween(this.camera.getLocalRotation()).to(this.defaultRotation, 1, pc.SineInOut).start();
            this.camera.tween(this.camera.getLocalPosition()).to(this.defaultPosEntity.getLocalPosition(), 1, pc.SineInOut).start().on("complete", () => { this.customPose = false; }, this);
        }
    });

    this.app.on("player:target", () => {
        self.isFollowing = true;
    });
};

// update code called every frame
CameraHandler.prototype.update = function (dt) {
    if (this.customPose) {

    } else {
        this.updateCameraControls(dt);
    }
};

CameraHandler.prototype.updateCameraControls = function (dt) {
    var tMouse = this.inertiaFactorMouse === 0 ? 1 : Math.min(dt / this.inertiaFactorMouse, 1);
    var tFollow = this.inertiaFactorFollow === 0 ? 1 : Math.min(dt / this.inertiaFactorFollow, 1);

    // stay with character
    this.pos.lerp(this.entity.getPosition(), this.followTarget.getPosition(), tMouse);
    this.entity.setPosition(this.pos);

    this.convoLerpTime += dt;
    let lerpFactor = pc.math.clamp(this.convoLerpTime / ConvoHandler.convoTransitionDuration, 0, 1);
    lerpFactor = lerpFactor * lerpFactor * (3 - 2 * lerpFactor);  // Ease in-out

    if (this.convoActive) {
        if (this.convoEngaging) {
            this.cameraTargetPos.lerp(this.defaultPosEntity.getLocalPosition(), this.convoPosEntity.getLocalPosition(), lerpFactor);
            this.cameraTargetRot.slerp(this.convoEngageFromRot, this.followTarget.getRotation(), lerpFactor);
            this.entity.setRotation(this.cameraTargetRot);

            // Reset camera pivot rotation
            let xRot = pc.math.lerp(this.convoRotXFrom, 0, lerpFactor);
            this.cameraPivotRot.setFromEulerAngles(xRot, this.cameraPivotRot.getEulerAngles().y, this.cameraPivotRot.getEulerAngles().z);
            this.camera.parent.setLocalRotation(this.cameraPivotRot);

            if (lerpFactor == 1) {
                this.convoEngaging = false;
                this.yRotGoal = 0;
            }
        } else {
            xRot = pc.math.lerp(this.cameraPivotRot.getEulerAngles().x, this.xRotGoal, tMouse);
            this.cameraPivotRot.setFromEulerAngles(xRot, this.cameraPivotRot.getEulerAngles().y, this.cameraPivotRot.getEulerAngles().z);
            this.camera.parent.setLocalRotation(this.cameraPivotRot);
        }
    } else {
        let xRot = 0.0;
        if (this.convoReleasing) {
            this.cameraTargetPos.lerp(this.convoPosEntity.getLocalPosition(), this.defaultPosEntity.getLocalPosition(), lerpFactor);
            xRot = pc.math.lerp(0, this.verticalLookDefault, lerpFactor);
            this.cameraPivotRot.setFromEulerAngles(xRot, this.cameraPivotRot.getEulerAngles().y, this.cameraPivotRot.getEulerAngles().z);
            this.camera.parent.setLocalRotation(this.cameraPivotRot);
            if (lerpFactor == 1) {
                this.convoReleasing = false;
                this.xRotGoal = this.verticalLookDefault;
            }
        } else {
            // look up and down
            xRot = pc.math.lerp(this.cameraPivotRot.getEulerAngles().x, this.xRotGoal, tMouse);
            this.cameraPivotRot.setFromEulerAngles(xRot, this.cameraPivotRot.getEulerAngles().y, this.cameraPivotRot.getEulerAngles().z);
            this.camera.parent.setLocalRotation(this.cameraPivotRot);
        }
    }
    this.camera.setLocalPosition(this.cameraTargetPos);

    // spin around character
    if (!this.convoEngaging) {
        if (this.isFollowing) {
            this.cameraTargetRot.slerp(this.entity.getRotation(), this.followTarget.getRotation(), tFollow);
            this.entity.setRotation(this.cameraTargetRot);
        } else {
            var yRot = pc.math.lerp(0, this.yRotGoal, tMouse);
            this.entity.rotate(0, yRot, 0);
            this.yRotGoal -= yRot;
        }
    }

    // avoid environment collision mesh
    var result = this.doRaycast();
    if (result) {
        var offset = result.normal.mulScalar(this.surfaceOffset);
        var newPosition = result.point.add(offset);
        this.camera.setPosition(newPosition);
    }
};

CameraHandler.prototype.updateXRotGoal = function (dx) {
    var pivotRotation = this.camera.parent.getLocalEulerAngles();
    this.xRotGoal = pc.math.clamp(pivotRotation.x + dx, this.verticalLookMin, this.verticalLookMax);
};

CameraHandler.prototype.updateYRotGoal = function (dy) {
    this.yRotGoal += dy;
};

CameraHandler.prototype.setCustomPose = function (targetPos) {

};

CameraHandler.prototype.doRaycast = function () {
    var from = this.entity.getPosition().add(this.offset);
    var to = this.camera.getPosition();
    return this.app.systems.rigidbody.raycastFirst(from, to);
};
