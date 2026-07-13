// More information about curves can be found at: 
// http://developer.playcanvas.com/en/user-manual/scripting/script-attributes/
// http://developer.playcanvas.com/en/api/pc.Curve.html

var AnimateScale = pc.createScript('animateScale');

AnimateScale.attributes.add('triggerEvent', {
    title: 'Trigger Event Name',
    description: 'Event to listen to.',
    type: 'string'
});

// Example of creating curve attribute with multiple curves (in this case, x, y, z)
AnimateScale.attributes.add("scaleCurve", {
    type: "curve", 
    title: "Scale Curve",
    description: "Scale applied to this entity over time.",
    curves: [ 'x', 'y', 'z' ]
});

AnimateScale.attributes.add("duration", {type: "number", default: 3, title: "Duration (secs)"});

AnimateScale.attributes.add('offset', {
    title: 'Offset Animation',
    description: 'If true that animation is only an offset to the start value.',
    type: 'boolean'
});

// initialize code called once per entity
AnimateScale.prototype.initialize = function() {
    
    this.animate = false;
    
    this.entity.on(this.triggerEvent, ()=>{this.animate = true;}, this);
    
    // Store the original position of the entity so we can offset from it
    this.startScale = this.entity.getLocalScale().clone();
    
    // Keep track of the current position
    this.scale = new pc.Vec3();
    
    this.time = 0;
};


// update code called every frame
AnimateScale.prototype.update = function(dt) {
    if(this.animate){
        this.time += dt;
    
        // Loop the animation forever
        if (this.time > this.duration) {
            this.animate = false;
            this.time = 0;
        }

        // Calculate how far in time we are for the animation
        var percent = this.time / this.duration;

        // Get curve values using current time relative to duration (percent)
        // The offsetCurve has 3 curves (x, y, z) so the returned value will be a set of 
        // 3 values
        var curveValue = this.scaleCurve.value(percent);

        if(this.offset){
            // Create our new position from the startPosition and curveValue
            this.scale.copy(this.startScale);
            this.scale.x += curveValue[0];
            this.scale.y += curveValue[1];
            this.scale.z += curveValue[2];
        } else {
            // Create our new position from the startPosition and curveValue
            this.scale.copy(this.startScale);
            this.scale.x = curveValue[0];
            this.scale.y = curveValue[1];
            this.scale.z = curveValue[2];
        }

        this.entity.setLocalScale(this.scale);
    }
};
