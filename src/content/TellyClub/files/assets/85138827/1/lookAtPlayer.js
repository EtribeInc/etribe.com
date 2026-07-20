var LookAtplayer = pc.createScript('lookAtplayer');

// initialize code called once per entity
LookAtplayer.prototype.initialize = function () {
    this.player = this.app.root.findByTag("MainCamera")[0];
};

// update code called every frame
LookAtplayer.prototype.update = function (dt) {
    if (this.player != undefined) {
        this.entity.lookAt(this.player.getPosition());
    }
};

// swap method called for script hot-reloading
// inherit your script state here
// LookAtplayer.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// https://developer.playcanvas.com/en/user-manual/scripting/