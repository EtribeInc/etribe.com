var NetworkedObject = pc.createScript('networkedObject');

// initialize code called once per entity
NetworkedObject.prototype.initialize = function () {
    this.restPosition = this.entity.getPosition().clone();
    this.ownership = false;
    this.networkHandler = this.app.root.findByTag("NetworkHandler")[0];
    console.log(this.networkHandler);
    this.networkHandler.script.networking.addObject(this.entity);
    this.entity.on('networkedObjectUpdate', this.onNetworkUpdate, this);

    this.entity.collision.on("collisionstart", this.onCollisionStart, this);

    this.entity.on("destroy", () => {
        //this.networkHandler.script.networking.socket.emit('objectUpdate', { uid, pos: [pos.x, pos.y, pos.z], rot: [rot.x, rot.y, rot.z, rot.w], angVel, linVel });
        //TODO reset ball 
    });
};

// update code called every frame
NetworkedObject.prototype.update = function (dt) {
    if (this.entity.getPosition().y < 0) {
        this.entity.rigidbody.angularVelocity = pc.Vec3.ZERO;
        this.entity.rigidbody.linearVelocity = pc.Vec3.ZERO;
        this.entity.rigidbody.teleport(this.restPosition, pc.Vec3.ZERO);
    }
    if (this.ownership)
        this.updateState();
};

NetworkedObject.prototype.updateState = function () {
    let angVel = this.entity.rigidbody.angularVelocity;
    let linVel = this.entity.rigidbody.linearVelocity;
    let pos = this.entity.getPosition();
    let rot = this.entity.getRotation();
    let uid = this.entity._guid;
    this.networkHandler.script.networking.socket.emit('objectUpdate', { uid, pos: [pos.x, pos.y, pos.z], rot: [rot.x, rot.y, rot.z, rot.w], angVel, linVel });
};

NetworkedObject.prototype.onNetworkUpdate = function (data) {
    //console.log("Network update received.");
    //console.log(data.pos);
    //this.entity.rigidbody.type = pc.BODYTYPE_KINEMATIC;
    this.entity.rigidbody.teleport(new pc.Vec3(data.pos), new pc.Quat(data.rot));
    //console.log(this.entity.getPosition());
    //this.entity.setRotation(data.rot);
    //this.entity.rigidbody.type = pc.BODYTYPE_DYNAMIC;
    this.entity.rigidbody.angularVelocity = data.angVel;
    this.entity.rigidbody.linearVelocity = data.linVel;
};

NetworkedObject.prototype.onCollisionStart = function (result) {
    if (result.other.tags.has("PlayerCollision")) {
        this.networkHandler.script.networking.claimObject(this.entity._guid);
        this.ownership = true;
    }
};

// swap method called for script hot-reloading
// inherit your script state here
// NetworkedObject.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// https://developer.playcanvas.com/en/user-manual/scripting/