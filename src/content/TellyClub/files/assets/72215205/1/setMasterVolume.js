var SetMasterVolume = pc.createScript('setMasterVolume');
SetMasterVolume.attributes.add("volume", {
    "title": "Volume",
    type: "number",
    default: 0.7,
    "min":0, 
    "max": 1
});

// initialize code called once per entity
SetMasterVolume.prototype.initialize = function() {
    this.app.systems.sound.manager.volume = this.volume;
};

// update code called every frame
SetMasterVolume.prototype.update = function(dt) {

};

// swap method called for script hot-reloading
// inherit your script state here
// SetMasterVolume.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// https://developer.playcanvas.com/en/user-manual/scripting/