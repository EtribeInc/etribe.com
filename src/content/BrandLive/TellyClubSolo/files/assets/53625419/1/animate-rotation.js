// More information about curves can be found at: 
// http://developer.playcanvas.com/en/user-manual/scripting/script-attributes/
// http://developer.playcanvas.com/en/api/pc.Curve.html

var AnimateRotation = pc.createScript('animateRotation');

AnimateRotation.attributes.add('loop', {
    title: 'Loop',
    description: 'If true that animation is looped.',
    type: 'boolean'
});

AnimateRotation.attributes.add('animateStart', {
    title: 'Animate on Start',
    description: 'If true that animation is started without wating for an event.',
    type: 'boolean'
});

AnimateRotation.attributes.add('triggerEvent', {
    title: 'Trigger Event Name',
    description: 'Event to listen to.',
    type: 'string'
});

// Example of creating curve attribute with multiple curves (in this case, x, y, z)
AnimateRotation.attributes.add("rotationCurve", {type: "curve", title: "Rotation Curve", curves: [ 'x', 'y', 'z' ]});
AnimateRotation.attributes.add("duration", {type: "number", default: 3, title: "Duration (secs)"});

AnimateRotation.attributes.add('offset', {
    title: 'Offset Animation',
    description: 'If true that animation is only an offset to the start value.',
    type: 'boolean'
});

// initialize code called once per entity
AnimateRotation.prototype.initialize = function() {
    
    this.animate = this.animateStart;
    
    this.entity.on(this.triggerEvent, ()=>{this.animate = true;}, this);
    
    // Store the original position of the entity so we can offset from it
    this.startRotation = this.entity.getEulerAngles().clone();
    
    // Keep track of the current position
    this.rotation = new pc.Vec3();
    
    this.time = 0;
};


// update code called every frame
AnimateRotation.prototype.update = function(dt) {
    
    if(this.animate){
        this.time += dt;
    
        // Loop the animation forever
        if (this.time > this.duration) {
            if(!this.loop)
                this.animate = false;
            this.time = 0;
        }

        // Calculate how far in time we are for the animation
        var percent = this.time / this.duration;

        // Get curve values using current time relative to duration (percent)
        // The rotationCurve has 3 curves (x, y, z) so the returned value will be a set of 
        // 3 values
        var curveValue = this.rotationCurve.value(percent);

        if(this.offset){
            // Create our new position from the startPosition and curveValue
            this.rotation.copy(this.startRotation);
            this.rotation.x += curveValue[0];
            this.rotation.y += curveValue[1];
            this.rotation.z += curveValue[2];
        } else {
            // Create our new position from the startPosition and curveValue
            this.rotation.copy(this.startRotation);
            this.rotation.x = curveValue[0];
            this.rotation.y = curveValue[1];
            this.rotation.z = curveValue[2];
        }

        this.entity.setEulerAngles(this.rotation);
    }
};
