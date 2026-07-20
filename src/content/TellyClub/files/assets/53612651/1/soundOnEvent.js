var SoundOnEvent = pc.createScript('soundOnEvent');

SoundOnEvent.attributes.add('eventName', {
    title: 'Event Name',
    description: 'Event to listen to.',
    type: 'string'
});

SoundOnEvent.attributes.add('globalEvent', {
    title: 'Global App Event',
    description: 'Should we listen to global events?',
    type: 'boolean'
});

SoundOnEvent.attributes.add('allSlots', {
    title: 'Play All Slots',
    description: 'Play all sound slots on the sound component.',
    type: 'boolean'
});


// initialize code called once per entity
SoundOnEvent.prototype.initialize = function() {
    var soundSrc = this.entity.sound;
    var target = this.globalEvent ? this.app : this.entity;
    target.on(this.eventName, ()=>{
        var slots = Object.values(soundSrc.slots);
        if(this.allSlots){
            for (var i = 0; i < slots.length; i++){
                soundSrc.play(slots[i].name);
            }
        } else
            soundSrc.play(slots[0].name);
    }, this);
};

// update code called every frame
SoundOnEvent.prototype.update = function(dt) {
    
};

// swap method called for script hot-reloading
// inherit your script state here
// SoundOnEvent.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// https://developer.playcanvas.com/en/user-manual/scripting/