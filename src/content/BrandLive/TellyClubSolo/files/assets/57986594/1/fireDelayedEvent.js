var FireDelayedEvent = pc.createScript('fireDelayedEvent');

FireDelayedEvent.attributes.add('delay', {
    title: 'Delay',
    description: 'Delay in seconds event is fired.',
    type: 'number'
});

FireDelayedEvent.attributes.add('eventName', {
    title: 'Event Name',
    description: 'Event to fire.',
    type: 'string'
});

FireDelayedEvent.attributes.add('globalEvent', {
    title: 'Global App Event',
    description: 'Should we fire a global event?',
    type: 'boolean'
});

FireDelayedEvent.attributes.add('autoFire', {
    title: 'Auto Fire',
    description: 'Automatically fire event on init.',
    type: 'boolean'
});

FireDelayedEvent.attributes.add('srcEventName', {
    title: 'Src Event Name',
    description: 'Event to listen to.',
    type: 'string'
});

FireDelayedEvent.attributes.add('eventForCancel', {
    title: 'Cancel Event',
    description: 'Event for cancel.',
    type: 'string'
});

// initialize code called once per entity
FireDelayedEvent.prototype.initialize = function() {
    if(this.autoFire)
        this.fireEvent(this.delay);
    else {
        this.entity.on(this.srcEventName, ()=>{
            this.fireEvent(this.delay);
        });
    }
    
    if (this.eventForCancel) {
        this.app.on(this.eventForCancel, () => { this.cancelEvent = true; }, this);
    }    
};

FireDelayedEvent.prototype.fireEvent = async function(delay) {
    
    await new Promise(r => setTimeout(r, this.delay * 1000));
    
    var target = this.globalEvent ? this.app : this.entity;
    
    if (this.cancelEvent == true) return;
    target.fire(this.eventName);
};

// update code called every frame
FireDelayedEvent.prototype.update = function(dt) {
    
};

// swap method called for script hot-reloading
// inherit your script state here
// FireDelayedEvent.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// http://developer.playcanvas.com/en/user-manual/scripting/