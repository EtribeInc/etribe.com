var EnableOnEvent = pc.createScript('enableOnEvent');

EnableOnEvent.attributes.add('defaultState', {
    title: 'Default State',
    description: 'Default Enable State of this Entity',
    type: 'boolean'
});

EnableOnEvent.attributes.add('enableEventName', {
    title: 'Enable Event Name',
    description: 'Event to listen to.',
    type: 'string'
});

EnableOnEvent.attributes.add('enableEventTarget', {
    title: 'Enable Event Target Entity',
    description: 'Entity listening on for event. If not specified it is handled as a global app event.',
    type: 'entity'
});

EnableOnEvent.attributes.add('disableEventName', {
    title: 'Disable Event Name',
    description: 'Event to listen to.',
    type: 'string'
});

EnableOnEvent.attributes.add('disableEventTarget', {
    title: 'Disable Event Target Entity',
    description: 'Entity listening on for event. If not specified it is handled as a global app event.',
    type: 'entity'
});


// initialize code called once per entity
EnableOnEvent.prototype.initialize = function() {
    this.entity.enabled = this.defaultState;
    var enableTarget = this.enableEventTarget ? this.enableEventTarget : this.app;
    console.log(enableTarget);
    enableTarget.on(this.enableEventName, ()=>{
        this.entity.enabled = true;
    }, this);
    enableTarget.on("destroy", ()=>enableTarget.off(this.enableEventName), this);


    disableTarget = this.disableEventTarget ? this.disableEventTarget : this.app;
    disableTarget.on(this.disableEventName, ()=>{
        this.entity.enabled = false;
    }, this);
    disableTarget.on("destroy", ()=>enableTarget.off(this.disableEventName), this);
};

// update code called every frame
EnableOnEvent.prototype.update = function(dt) {

};

// swap method called for script hot-reloading
// inherit your script state here
// EnableOnEvent.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// https://developer.playcanvas.com/en/user-manual/scripting/