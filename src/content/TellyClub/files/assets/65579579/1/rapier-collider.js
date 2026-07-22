var RapierCollider = pc.createScript('rapierCollider');

RapierCollider.attributes.add("shape", {
    type: "number",
    enum: [
            {'Ball':0},
            {'Cuboid':1},
            {'Capsule':2},
            {'Cylinder':10}
    ]
});

RapierCollider.attributes.add("ballSettings", {
    type: "json",
    schema: [{
        name: "radius",
        type: "number",
        default: 0.5
    }]
});

RapierCollider.attributes.add("cuboidSettings", {
    type: "json",
    schema: [{
        name: "hx",
        type: "number",
        default: 0.5
    },{
        name: "hy",
        type: "number",
        default: 0.5
    },{
        name: "hz",
        type: "number",
        default: 0.5
    }]
});

RapierCollider.attributes.add("capsuleSettings", {
    type: "json",
    schema: [{
        name: "halfHeight",
        type: "number",
        default: 0.5
    },{
        name: "radius",
        type: "number",
        default: 0.5
    }]
});

RapierCollider.attributes.add("cylinderSettings", {
    type: "json",
    schema: [{
        name: "halfHeight",
        type: "number",
        default: 0.5
    },{
        name: "radius",
        type: "number",
        default: 0.5
    }]
});

// initialize code called once per entity
RapierCollider.prototype.initialize = function() {
    console.log(this.entity.script.has('rapierRigidBody'));
    if(this.entity.script.has('rapierRigidBody'))
        this.entity.on("rapier:rigidBody:initialized", this.startSimulation, this);
    else
        this.app.on("rapier:initialized", this.startSimulation, this);

};

// update code called every frame
RapierCollider.prototype.update = function(dt) {

};

RapierCollider.prototype.startSimulation = function(RAPIER, world, rigidBody){
    let colliderDesc;
    switch(this.shape){
        case 0:
            colliderDesc = RAPIER.ColliderDesc.ball(this.ballSettings.radius);
            break;
        case 1:
            colliderDesc = RAPIER.ColliderDesc.cuboid(this.cuboidSettings.hx, this.cuboidSettings.hy, this.cuboidSettings.hz);
            break;
        case 2:
            colliderDesc = RAPIER.ColliderDesc.capsule(this.capsuleSettings.halfHeight, this.capsuleSettings.radius);
            break;
        case 3:
            colliderDesc = RAPIER.ColliderDesc.cylinder(this.capsuleSettings.halfHeight, this.capsuleSettings.radius);
            break;
    }

    let rot = this.entity.getLocalRotation();
    let pos = this.entity.getLocalPosition();

    // The collider translation wrt. the body it is attached to.
    // Default: the zero vector.
    colliderDesc.setTranslation(pos.x, pos.y, pos.z)
    // The collider rotation wrt. the body it is attached to, as a unit quaternion.
    // Default: the identity rotation.
    .setRotation({ w: rot.w, x: rot.x, y: rot.y, z: rot.z })
    // The collider density. If non-zero the collider's mass and angular inertia will be added
    // to the inertial properties of the body it is attached to.
    // Default: 1.0
    .setDensity(1.0)
    // The friction coefficient of this collider.
    // Default: 0.5
    .setFriction(0.5)
    // Whether this collider is a sensor, i.e., generate only intersection events.
    // Default: false
    .setSensor(false)

    if(rigidBody){
        this.collider = world.createCollider(colliderDesc, rigidBody.handle);
        console.log("creating collider with rigidbody");
    }
    else{
        this.collider = world.createCollider(colliderDesc);
        console.log("creating collider without rigidbody");
    }
};

// swap method called for script hot-reloading
// inherit your script state here
// RapierCollider.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// https://developer.playcanvas.com/en/user-manual/scripting/