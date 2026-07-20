var RemotePlayer = pc.createScript('remotePlayer');

RemotePlayer.modelHandler = null;

// initialize code called once per entity
RemotePlayer.prototype.initialize = function() {
    this.modelHandler = this.entity.script.get('modelHandler');
};

// update code called every frame
RemotePlayer.prototype.update = function(dt) {
    
};

// swap method called for script hot-reloading
// inherit your script state here
// RemotePlayer.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// https://developer.playcanvas.com/en/user-manual/scripting/