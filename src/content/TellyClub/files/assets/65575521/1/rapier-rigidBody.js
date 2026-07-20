var RapierRigidBody = pc.createScript('rapierRigidBody');

RapierRigidBody.attributes.add("type", {
    type: "number",
    enum: [
            {'Dynamic':0},
            {'Static':1},
            {'KinematicPositionBased':2},
            {'KinematicVelocityBased':3}
    ]
});

// initialize code called once per entity
RapierRigidBody.prototype.initialize = function() {
    this.app.on("rapier:initialized", this.startSimulation, this);
};

// update code called every frame
RapierRigidBody.prototype.update = function(dt) {
    if (this.rigidBody){
        if(this.type === 0){
            let pos = this.rigidBody.translation();
            let rot = this.rigidBody.rotation();
            this.entity.setLocalPosition(pos.x,pos.y,pos.z);
            this.entity.setLocalRotation(rot.x, rot.y, rot.z, rot.w);
        } else if (this.type === 2){
            let pos = this.entity.getPosition();
            let rot = this.entity.getRotation();
            this.rigidBody.setTranslation(pos.x, pos.y, pos.z);
            this.rigidBody.setRotation(rot.w, rot.x, rot.y, rot.z);
        }
    }
};

RapierRigidBody.prototype.startSimulation = function(RAPIER, world){
    let descr = new RAPIER.RigidBodyDesc(this.type);
    let rot = this.entity.getLocalRotation();
    let pos = this.entity.getLocalPosition();

    descr.setTranslation(pos.x, pos.y, pos.z)
    // The rigid body rotation, given as a quaternion.
    // Default: no rotation.
    .setRotation({ w: rot.w, x: rot.x, y: rot.y, z: rot.z})
    // The linear velocity of this body.
    // Default: zero velocity.
    .setLinvel(0.0, 0.0, 0.0)
    // The angular velocity of this body.
    // Default: zero velocity.
    .setAngvel({ x: 0.0, y: 0.0, z: 0.0 })
    // The scaling factor applied to the gravity affecting the rigid-body.
    // Default: 1.0
    .setGravityScale(1)
    // Whether or not this body can sleep.
    // Default: true
    .setCanSleep(false)
    // Whether or not CCD is enabled for this rigid-body.
    // Default: false
    .setCcdEnabled(true);

    this.rigidBody = world.createRigidBody(descr);

    this.entity.fire("rapier:rigidBody:initialized", RAPIER, world, this.rigidBody);
};

// swap method called for script hot-reloading
// inherit your script state here
// RapierRigidBody.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// http://developer.playcanvas.com/en/user-manual/scripting/