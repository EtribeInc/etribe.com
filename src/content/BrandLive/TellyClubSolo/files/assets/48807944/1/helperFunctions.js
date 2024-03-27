(function() {
var MAX_CACHE = 256;

var quats = [];
var vecs = [];
var nextQuat = 0;
var nextVec = 0;

for (var i = 0; i < MAX_CACHE; i++) {
    vecs.push(new pc.Vec3());
    quats.push(new pc.Quat());
}

function Q(existing) {
    var q = quats[nextQuat++ & (MAX_CACHE-1)];
    if (existing !== false) q.copy(existing || pc.Quat.IDENTITY);
    return q;
}

function V(existing, y, z) {
    var v = vecs[nextVec++ & (MAX_CACHE-1)];
    if (y !== undefined && z !== undefined) {
        var d = v.data;
        d[0] = existing;
        d[1] = y;
        d[2] = z;
        return v;
    }
    if (existing !== undefined) {
        var d1 = v.data;
        var d2 = existing.data;
        d1[0] = d2[0];
        d1[1] = d2[1];
        d1[2] = d2[2];
    }
    return v;
}

pc.Vec3.temp = V;
pc.Quat.temp = Q;

function angleBetween(vector1, vector2, up) {
     up = up || pc.Vec3.UP;
     return Math.atan2(V().cross(vector1, vector2).dot(up), vector1.dot(vector2)) * pc.math.RAD_TO_DEG;
   }

pc.Vec3.prototype.angle = function(vector, up) { return angleBetween(this, vector, up); };

function orthogonal(v) {

    var x = Math.abs(v.x);
    var y = Math.abs(v.y);
    var z = Math.abs(v.z);
    var other = x < y
        ? ( x < z
            ? pc.Vec3.RIGHT
            : pc.Vec3.FORWARD )
        : ( y < z
            ? pc.Vec3.UP
            : pc.Vec3.FORWARD );
     return V().cross(v, other);
  }

function fromToRotation(v1, v2, q) {
    var kct = v1.dot(v2);
    q = q || Q();
    if (kct <= -0.999) {
        q.w = 0;
        var v = orthogonal(v1).normalize();
        q.x = v.x;
        q.y = v.y;
        q.z = v.z;
        return q;
    }
    var half = V(v1).add(v2).scale(0.5);
    q.w = v1.dot(half);
    var cross = V().cross(v1, half);
    q.x = cross.x;
    q.y = cross.y;
    q.z = cross.z;
    return q.normalize();
}

pc.Quat.prototype.fromToRotation = function(v1,v2) {
    return fromToRotation(v1, v2, this);
};

pc.Quat.prototype.twist = function(axis) {
    var orth = orthogonal(axis);
    var transformed = this.transformVector(orth, V());
    var flattened = V(transformed).sub(V(axis).scale(transformed.dot(axis))).normalize();
    var angle = Math.acos(orth.dot(flattened)) * pc.math.RAD_TO_DEG;
    return V(this.x, this.y, this.z).dot(axis) > 0 ? -angle : angle;
};

var m = new pc.Mat4();

pc.Quat.prototype.lookAt = function(from, to, up) {
    m.setLookAt(from, to, up || pc.Vec3.UP);
    this.setFromMat4(m);
    return this;
};

var oldMul = pc.Vec3.prototype.mul;

pc.Vec3.prototype.mul = function(p0,p1,p2) {
    if(p0 instanceof pc.Quat) {
        return p0.transformVector(this, this);
    } else
        return oldMul.call(this, p0,p1,p2);
};
})();