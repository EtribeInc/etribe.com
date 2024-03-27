var PlayerController = pc.createScript('playerController');

PlayerController.attributes.add('playerPathSpeed', { type: 'number', default: 2, title: 'Player Path Speed' });
PlayerController.attributes.add('playerBackwardsSpeed', { type: 'number', default: 1, title: 'Player Backwards Speed' });
PlayerController.attributes.add('playerRotationSpeed', { type: 'number', default: 75, title: 'Player Rotation Speed' });
PlayerController.attributes.add('playerEntity', { type: 'entity', title: 'Player Entity' });
PlayerController.attributes.add('timeToFollow', { type: 'number', title: 'Time To Follow' });
PlayerController.attributes.add('meetingMoveTimeout', { type: 'number', title: 'Meeting Timeout' });

// initialize code called once per entity
PlayerController.prototype.initialize = function () {
    this.app.playerEntity = this.playerEntity;
    var self = this;
    this.modelHandler = this.entity.script.get("modelHandler");
    this.cameraHandler = this.app.root.findByName("CameraTarget").script.cameraHandler;

    var characterID = getURLParameter("char") ? getURLParameter("char") : 0;
    this.modelHandler.instantiateModel(characterID);

    this.directControlForwardMovementTimer = 0;
    this.hasDirectControl = false;
    this.directControlForward = false;
    this.directControlBackward = false;
    this.directControlLeft = false;
    this.directControlRight = false;
    this.directMovementTimer = 0;

    this.adjusting = false;

    this.groundCheckRay = new pc.Vec3(0, 0.5, 0);
    this.rayStart = new pc.Vec3();
    this.rayEnd = new pc.Vec3();

    this.direction = new pc.Vec3();
    this.distanceToTravel = 0;
    this.targetPosition = new pc.Vec3();
    this.newPosition = new pc.Vec3();

    this.angle = 0;
    this.targetAngle = 0;
    this.crowdEntity = this.app.root.findByName('Crowd');
    this.agentEntity = this.app.root.findByName("Player");

    //this.app.on('player:wave', this.playerPathfindingStop, this);
    this.app.on('player:dance', this.playerPathfindingStop, this);

    this.app.on('player:target', this.onNewTarget, this);
    this.app.on('player:adjust', this.adjustPosition, this);

    this.modelHandler.model.on("curve:update", (offset) => {
        let pos = new pc.Vec3();
        pos.add2(this.exitPos, this.entity.forward.mulScalar(offset));
        self.crowdEntity.fire('OrestisPathfinding:teleportAgentsTo', [self.agentEntity], pos);
    }, this);
    this.app.on("player:exit", () => {
        this.exitPos = this.playerEntity.getPosition().clone();
        this.modelHandler.model.fire("curve:start");
        // this.resetDirectControl();
        // this.setDirectControl('backward', true);
        // setTimeout(() => this.resetDirectControl(), 1300);
    }, this);

    this.on('destroy', function () {
        this.app.off('player:target', this.onNewTarget);
        this.app.off('player:adjust', this.adjustPosition);
        this.app.off("player:exit");
    });


};

PlayerController.prototype.playerPathfindingStop = function () {
    this.targetAngle = this.angle;
    this.targetPosition.copy(this.playerEntity.getPosition());
    this.distanceToTravel = 0;
    this.direction.set(0, 0, 0);
};

// update code called every frame
PlayerController.prototype.update = function (dt) {
    if (this.hasDirectControl)
        this.doDirectControl(dt);
    else if (this.adjusting == false);
    this.doPathFinding(dt);
};

PlayerController.prototype.doAdjustPosition = function () {
    this.playerPathfindingStop();
    this.app.fire('player:idle');
    var self = this;
    this.adjusting = true;
    console.log("Adjusting player transform");
    let pos = self.playerEntity.getPosition();
    this.playerEntity.tween(pos).to(self.adjustTarget, 0.5, pc.SineInOut).on('update', function () {
        self.crowdEntity.fire('OrestisPathfinding:teleportAgentsTo', [self.agentEntity], pos);
        self.playerEntity.lookAt(self.adjustCenter.x, self.playerEntity.getPosition().y, self.adjustCenter.z);

    }).on('complete', function () {
        console.log("Adjusting complete.");
        self.adjusting = false;
    }).start();
    //this.playerEntity.tween(self.playerEntity.getLocalEulerAngles()).rotate({x:0, y: self.adjustTargetRot, z:0}, 0.5, pc.SineInOut).start();
};

PlayerController.prototype.adjustPosition = function (target, center) {
    var self = this;
    this.adjustTarget = target;
    this.adjustCenter = center;
    this.doAdjustPosition();
};

PlayerController.prototype.doPathFinding = function (dt) {
    if (Math.abs(this.angle) < Math.abs(this.targetAngle)) {
        var step = dt * this.targetAngle * 5;
        this.angle += step;
        if (Math.abs(this.angle) > Math.abs(this.targetAngle))
            this.playerEntity.lookAt(this.targetPosition);
        else
            this.playerEntity.rotateLocal(0, step, 0);
    } else if (this.direction.lengthSq() > 0) {
        this.app.fire('player:walk');
        // Move in the direction at a set speed
        var d = this.playerPathSpeed * dt;
        var newPosition = this.newPosition;

        newPosition.copy(this.direction).scale(d);
        newPosition.add(this.playerEntity.getPosition());

        // See if new position is on ground
        var result = this.findGround(newPosition);
        if (result) {
            newPosition = result.point;
            this.crowdEntity.fire('OrestisPathfinding:teleportAgentsTo', [this.agentEntity], newPosition);
            this.distanceToTravel -= d;
        } else {
            this.targetPosition.copy(this.playerEntity.getPosition());
            this.distanceToTravel = 0;
        }

        // If we have reached a path point, clamp the position and reset the direction
        if (this.distanceToTravel <= 0) {
            if (this.path.length > 0) {
                //set the next point on the path as the next target
                this.targetPosition.copy(this.path.shift());

                // Assuming we are travelling on a flat, horizontal surface, we make the Y the same
                // as the player
                this.targetPosition.y = this.playerEntity.getPosition().y;

                this.distanceTravelled = 0;

                // Work out the direction that the player needs to travel in
                this.direction.sub2(this.targetPosition, this.playerEntity.getPosition());

                // Get the distance the player needs to travel for
                this.distanceToTravel = this.direction.length();

                if (this.distanceToTravel > 0) {
                    // Ensure the direction is a unit vector
                    this.direction.normalize();
                    this.angle = 0;
                    this.targetAngle = this.playerEntity.forward.angle(this.direction);
                } else {
                    this.direction.set(0, 0, 0);
                }
            } else {
                this.direction.set(0, 0, 0);
                this.app.fire('player:idle');
            }
        }
    }
};

PlayerController.prototype.onNewTarget = function (worldPosition) {
    this.app.fire("player:inMotion");
    var self = this;
    this.crowdEntity.fire('OrestisPathfinding:teleportAgentsTo', [this.agentEntity], this.agentEntity.getPosition());
    this.crowdEntity.fire('OrestisPathfinding:moveAgentsTo', [this.agentEntity], worldPosition, false);

    this.crowdEntity.fire('OrestisPathfinding:getPath', this.agentEntity, (path) => {
        if (path) {
            //console.log(Object.values(path)[0]);
            self.path = Object.values(path)[0];

            //remove first element in path, as this is the players position
            self.path.shift();

            //set the next point on the path as the next target
            self.targetPosition.copy(self.path.shift());

            // Assuming we are travelling on a flat, horizontal surface, we make the Y the same
            // as the player
            self.targetPosition.y = self.playerEntity.getPosition().y;

            self.distanceTravelled = 0;

            // Work out the direction that the player needs to travel in
            self.direction.sub2(self.targetPosition, self.playerEntity.getPosition());

            // Get the distance the player needs to travel for
            self.distanceToTravel = self.direction.length();

            if (self.distanceToTravel > 0) {
                // Ensure the direction is a unit vector
                self.direction.normalize();
                self.angle = 0;
                self.targetAngle = self.playerEntity.forward.angle(self.direction);
            } else {
                self.direction.set(0, 0, 0);
            }
        }
    });
};

PlayerController.prototype.setDirectControl = function (direction, value) {
    if (value) { this.playerPathfindingStop(); }
    if (direction == 'forward') {
        if (value) { this.app.fire('player:walk'); }
        else {
            if (this.directControlLeft) this.app.fire('player:turnleft');
            if (this.directControlRight) this.app.fire('player:turnright');
            this.directControlForwardMovementTimer = 0;
        }
        this.directControlForward = value;
    }
    if (direction == 'backward') {
        if (value) { this.app.fire('player:walkback'); }
        else {
            if (this.directControlLeft) this.app.fire('player:turnleft');
            if (this.directControlRight) this.app.fire('player:turnright');
        }
        this.directControlBackward = value;
    }
    let isWalking = this.directControlForward || this.directControlBackward;
    if (direction == 'left') {
        if (value && !isWalking) this.app.fire('player:turnleft');
        this.directControlLeft = value;
    }
    if (direction == 'right') {
        if (value && !isWalking) this.app.fire('player:turnright');
        this.directControlRight = value;
    }
    this.hasDirectControl = (this.directControlForward || this.directControlBackward || this.directControlLeft || this.directControlRight);
    if (!this.hasDirectControl) {
        this.app.fire('player:idle');
    }
};

PlayerController.prototype.resetDirectControl = function () {
    console.log("Reset direct control");
    this.hasDirectControl = false;
    this.directControlForward = false;
    this.directControlBackward = false;
    this.directControlLeft = false;
    this.directControlRight = false;
    this.app.fire('player:idle');
    this.directMovementTimer = 0;
};

PlayerController.prototype.doDirectControl = function (dt) {
    this.directMovementTimer += dt;
    if (this.directMovementTimer > this.meetingMoveTimeout)
        this.app.fire("player:inMotion");

    var newPosition = this.newPosition;
    var result = null;
    var rotationModifier = this.directControlBackward ? -1 : 1;

    if (this.directControlLeft) {
        this.playerEntity.rotateLocal(0, dt * this.playerRotationSpeed * rotationModifier, 0);
    }
    if (this.directControlRight) {
        this.playerEntity.rotateLocal(0, dt * -this.playerRotationSpeed * rotationModifier, 0);
    }
    if (this.directControlForward) {
        newPosition = this.playerEntity.getPosition().add(this.playerEntity.forward.mulScalar(dt * this.playerPathSpeed));
        result = this.findGround(newPosition);
        if (result) newPosition = result.point;
        this.crowdEntity.fire('OrestisPathfinding:teleportAgentsTo', [this.agentEntity], newPosition);
        this.directControlForwardMovementTimer += dt;
        if (this.directControlForwardMovementTimer > this.timeToFollow && !InputHandler.instance.mouseIsMoving) // && !InputHandler.instance.pointerDown)
            this.cameraHandler.isFollowing = true;
    }
    if (this.directControlBackward) {
        newPosition = this.playerEntity.getPosition().add(this.playerEntity.forward.mulScalar(-dt * this.playerBackwardsSpeed));
        result = this.findGround(newPosition);
        if (result) newPosition = result.point;
        this.crowdEntity.fire('OrestisPathfinding:teleportAgentsTo', [this.agentEntity], newPosition);
    }
};

PlayerController.prototype.findGround = function (newPosition) {
    this.rayStart.add2(newPosition, this.groundCheckRay);
    this.rayEnd.sub2(newPosition, this.groundCheckRay);
    // Fire a ray straight down to just below the new desired position, 
    // if it hits something then the character will be standing on something.
    var result = this.app.systems.rigidbody.raycastFirst(this.rayStart, this.rayEnd);
    return result;
};