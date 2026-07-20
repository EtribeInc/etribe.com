var ScaleOnEvent = pc.createScript('scaleOnEvent');

ScaleOnEvent.attributes.add('defaultState', {
    title: 'Default State',
    description: 'Default Enable State of this Entity',
    type: 'boolean'
});

ScaleOnEvent.attributes.add('enableEventName', {
    title: 'Enable Event Name',
    description: 'Event to listen to.',
    type: 'string'
});

ScaleOnEvent.attributes.add('enableEventTarget', {
    title: 'Enable Event Target Entity',
    description: 'Entity listening on for event. If not specified it is handled as a global app event.',
    type: 'entity'
});

ScaleOnEvent.attributes.add('disableEventName', {
    title: 'Disable Event Name',
    description: 'Event to listen to.',
    type: 'string'
});

ScaleOnEvent.attributes.add('disableEventTarget', {
    title: 'Disable Event Target Entity',
    description: 'Entity listening on for event. If not specified it is handled as a global app event.',
    type: 'entity'
});


// initialize code called once per entity
ScaleOnEvent.prototype.initialize = function() {
    this.entity.setLocalScale(this.defaultState?new pc.Vec3(1,1,1) : new pc.Vec3(0,0,0));
    var enableTarget = this.enableEventTarget ? this.enableEventTarget : this.app;
    enableTarget.on(this.enableEventName, ()=>{
        this.entity.setLocalScale(1,1,1);
    }, this);
    enableTarget.on("destroy", ()=>enableTarget.off(this.enableEventName), this);


    disableTarget = this.disableEventTarget ? this.disableEventTarget : this.app;
    disableTarget.on(this.disableEventName, ()=>{
        this.entity.setLocalScale(0,0,0);
    }, this);
    disableTarget.on("destroy", ()=>enableTarget.off(this.disableEventName), this);
};

// update code called every frame
ScaleOnEvent.prototype.update = function(dt) {

};

// swap method called for script hot-reloading
// inherit your script state here
// ScaleOnEvent.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// https://developer.playcanvas.com/en/user-manual/scripting/