// More information about curves can be found at: 
// http://developer.playcanvas.com/en/user-manual/scripting/script-attributes/
// http://developer.playcanvas.com/en/api/pc.Curve.html

var AnimatePosition = pc.createScript('animatePosition');

AnimatePosition.attributes.add('loop', {
    title: 'Loop',
    description: 'If true that animation is looped.',
    type: 'boolean'
});

AnimatePosition.attributes.add('animateStart', {
    title: 'Animate on Start',
    description: 'If true that animation is started without wating for an event.',
    type: 'boolean'
});

AnimatePosition.attributes.add('triggerEvent', {
    title: 'Trigger Event Name',
    description: 'Event to listen to.',
    type: 'string'
});

// Example of creating curve attribute with multiple curves (in this case, x, y, z)
AnimatePosition.attributes.add("animCurve", {
    type: "curve", 
    title: "Position Curve",
    description: "Position applied to this entity over time.",
    curves: [ 'x', 'y', 'z' ]
});

AnimatePosition.attributes.add("duration", {type: "number", default: 3, title: "Duration (secs)"});

AnimatePosition.attributes.add('offset', {
    title: 'Offset Animation',
    description: 'If true that animation is only an offset to the start value.',
    type: 'boolean'
});

// initialize code called once per entity
AnimatePosition.prototype.initialize = function() {
    
    this.animate = this.animateStart;
    
    this.entity.on(this.triggerEvent, ()=>{this.animate = true;}, this);
    
    // Store the original position of the entity so we can offset from it
    this.startPos = this.entity.getLocalPosition().clone();
    
    // Keep track of the current position
    this.pos = new pc.Vec3();
    
    this.time = 0;
};


// update code called every frame
AnimatePosition.prototype.update = function(dt) {
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
        // The animCurve has 3 curves (x, y, z) so the returned value will be a set of 
        // 3 values
        var curveValue = this.animCurve.value(percent);

        if(this.offset){
            // Create our new position from the startPosition and curveValue
            this.pos.copy(this.startPos);
            this.pos.x += curveValue[0];
            this.pos.y += curveValue[1];
            this.pos.z += curveValue[2];
        } else {
            // Create our new position from the startPosition and curveValue
            this.pos.copy(this.startPos);
            this.pos.x = curveValue[0];
            this.pos.y = curveValue[1];
            this.pos.z = curveValue[2];
        }
        

        this.entity.setLocalPosition(this.pos);
    }
};
