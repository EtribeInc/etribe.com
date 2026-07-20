var CameraTruck = pc.createScript('cameraTruck');

CameraTruck.attributes.add('inertiaFactor', {
    type: 'number',
    default: 0.2,
    min: 0.1,
    max: 0.5,
    title: 'Inertia Factor'
});

CameraTruck.attributes.add('horizontalRange', {
    type: 'number',
    default: 0.2,
    title: 'Horizontal Range'
});

CameraTruck.attributes.add('verticalRange', {
    type: 'number',
    default: 0.2,
    title: 'Vertical Range'
});

// initialize code called once per entity
CameraTruck.prototype.initialize = function() {
    this.posOriginal = this.entity.getPosition().clone();
    this.posGoal = new pc.Vec3(pc.Vec3.ZERO);
    this.posNew = new pc.Vec3(pc.Vec3.ZERO);
    this.x = 0;
    this.y = 0;
    
    // slope = (output_end - output_start) / (input_end - input_start)
    this.horizontalSlope = ((this.posOriginal.x + (this.horizontalRange / 2)) - (this.posOriginal.x - (this.horizontalRange / 2))) / window.innerWidth;
    this.verticalSlope = ((this.posOriginal.y + (this.verticalRange / 2)) - (this.posOriginal.y - (this.verticalRange / 2))) / window.innerHeight;

    this.app.mouse.on(pc.EVENT_MOUSEMOVE, this.onMouseMove, this);
};

// update code called every frame
CameraTruck.prototype.update = function(dt) {
    // output = output_start + slope * (input - input_start)
    var horizontalOutput = (this.posOriginal.x - (this.horizontalRange / 2)) + this.horizontalSlope * this.x;
    var verticalOutput = (this.posOriginal.y - (this.verticalRange / 2)) + this.verticalSlope * this.y;
    this.posGoal.set(horizontalOutput, verticalOutput, this.posOriginal.z);
    
    var t = this.inertiaFactor === 0 ? 1 : Math.min(dt / this.inertiaFactor, 1);
    this.posNew.lerp(this.entity.getPosition(), this.posGoal, t);
    this.entity.setPosition(this.posNew);
};

CameraTruck.prototype.onMouseMove = function (event) {
    this.x = event.x;
    this.y = event.y;
};