var NetworkedObject = pc.createScript('networkedObject');

// initialize code called once per entity
NetworkedObject.prototype.initialize = function () {
    this.restPosition = this.entity.getPosition().clone();
    this.ownership = false;
    this.buf = [];
    this.sendAccum = 0;
    this.networkHandler = this.app.root.findByTag("NetworkHandler")[0];
    this.networkHandler.script.networking.addObject(this.entity);
    this.entity.on('networkedObjectUpdate', this.onNetworkUpdate, this);

    // ownership arbitration result (may revoke an optimistic claim)
    this.entity.on('networkedObjectOwner', function (owner) {
        this.ownership = (owner === Networking.id);
        if (this.ownership) this.buf = [];
    }, this);

    this.entity.collision.on("collisionstart", this.onCollisionStart, this);
};

// update code called every frame
NetworkedObject.prototype.update = function (dt) {
    if (this.entity.getPosition().y < 0) {
        this.entity.rigidbody.angularVelocity = pc.Vec3.ZERO;
        this.entity.rigidbody.linearVelocity = pc.Vec3.ZERO;
        this.entity.rigidbody.teleport(this.restPosition, pc.Vec3.ZERO);
    }

    if (this.ownership) {
        this.sendAccum += dt;
        if (this.sendAccum >= 1 / P2P_OBJ_HZ) {
            this.sendAccum %= 1 / P2P_OBJ_HZ;
            this.updateState();
        }
    } else if (this.buf.length) {
        if (performance.now() - this.buf[this.buf.length - 1].t < P2P_OBJ_STALE_MS) {
            this.interpolate();
        } else {
            // owner went quiet: let local physics coast on the last velocities
            this.buf = [];
        }
    }
};

NetworkedObject.prototype.interpolate = function () {
    var renderT = performance.now() - P2P_INTERP_MS;
    var buf = this.buf;
    while (buf.length >= 2 && buf[1].t <= renderT) buf.shift();

    var pos, rot;
    if (buf.length >= 2 && buf[0].t <= renderT) {
        var a = buf[0], b = buf[1];
        var k = pc.math.clamp((renderT - a.t) / (b.t - a.t), 0, 1);
        pos = new pc.Vec3(
            a.p[0] + (b.p[0] - a.p[0]) * k,
            a.p[1] + (b.p[1] - a.p[1]) * k,
            a.p[2] + (b.p[2] - a.p[2]) * k
        );
        rot = new pc.Quat().slerp(
            new pc.Quat(a.r[0], a.r[1], a.r[2], a.r[3]),
            new pc.Quat(b.r[0], b.r[1], b.r[2], b.r[3]),
            k
        );
    } else {
        var last = buf[buf.length - 1];
        pos = new pc.Vec3(last.p[0], last.p[1], last.p[2]);
        rot = new pc.Quat(last.r[0], last.r[1], last.r[2], last.r[3]);
    }
    this.entity.rigidbody.teleport(pos, rot);
};

NetworkedObject.prototype.updateState = function () {
    this.networkHandler.script.networking.sendObjectUpdate(
        this.entity._guid,
        this.entity.getPosition(),
        this.entity.getRotation(),
        this.entity.rigidbody.angularVelocity,
        this.entity.rigidbody.linearVelocity
    );
};

NetworkedObject.prototype.onNetworkUpdate = function (data) {
    this.buf.push({ t: performance.now(), p: data.p, r: data.r });
    if (this.buf.length > 10) this.buf.shift();
    this.entity.rigidbody.angularVelocity = new pc.Vec3(data.a[0], data.a[1], data.a[2]);
    this.entity.rigidbody.linearVelocity = new pc.Vec3(data.l[0], data.l[1], data.l[2]);
};

NetworkedObject.prototype.onCollisionStart = function (result) {
    if (result.other.tags.has("PlayerCollision")) {
        // optimistic claim; arbitration may revoke it via 'networkedObjectOwner'
        this.networkHandler.script.networking.claimObject(this.entity._guid);
    }
};

// swap method called for script hot-reloading
// inherit your script state here
// NetworkedObject.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// https://developer.playcanvas.com/en/user-manual/scripting/
