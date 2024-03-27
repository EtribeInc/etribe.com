var AudioRepeat = pc.createScript('audioRepeat');

AudioRepeat.attributes.add('rangeMin', {
    title: "Range Minimum",
    type: 'number',
    default: 0
});

AudioRepeat.attributes.add('rangeMax', {
    title: "Range Maximum",
    type: 'number',
    default: 5
});

// initialize code called once per entity
AudioRepeat.prototype.initialize = function() {
    this.audioSrc = this.entity.sound;
    
    this.timer = 0;
    this.timerTarget = pc.math.random(this.rangeMin, this.rangeMax);
    
    this.soundSlots = Object.values(this.audioSrc.slots);
};

// update code called every frame
AudioRepeat.prototype.update = function(dt) {
    this.timer += dt;
    if(this.timer >= this.timerTarget){
        const random = pc.math.random(-0.5, this.soundSlots.length - 0.5);        
        const index = Math.round(random);
        this.audioSrc.play(this.soundSlots[index].name);
        this.timer = 0;
        this.timerTarget = pc.math.random(this.rangeMin, this.rangeMax);
    }
};

// swap method called for script hot-reloading
// inherit your script state here
// AudioRepeat.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// https://developer.playcanvas.com/en/user-manual/scripting/