var EventToEvent = pc.createScript('eventToEvent');

EventToEvent.attributes.add('eventInput', {
    title: 'Input Event Name',
    description: 'Event to listen to.',
    type: 'string'
});

EventToEvent.attributes.add('localIn', {
    title: 'Local In Event',
    description: 'Listen to the event only on this entity.',
    type: 'boolean'
});

EventToEvent.attributes.add('eventOutput', {
    title: 'Output Event Name',
    description: 'Event to fire.',
    type: 'string'
});

EventToEvent.attributes.add('localOut', {
    title: 'Local Out Event',
    description: 'Fire the event only on this entity.',
    type: 'boolean'
});

// initialize code called once per entity
EventToEvent.prototype.initialize = function() {
    var src = this.localIn?this.entity:this.app;
    var target = this.localOut?this.entity:this.app;
    
    src.on(this.eventInput, function(event) {
        target.fire(this.eventOutput);
    }, this);
    
    this.entity.script.on('disable', function(event) {
        src.off(this.eventInput, function(event) {
            target.fire(this.eventOutput);
        }, this);
    });
    
    this.entity.script.on('enable', function(event) {
        src.on(this.eventInput, function(event) {
            target.fire(this.eventOutput);
        }, this);
    });
};

// update code called every frame
EventToEvent.prototype.update = function(dt) {
    
};

// swap method called for script hot-reloading
// inherit your script state here
// EventToEvent.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// https://developer.playcanvas.com/en/user-manual/scripting/