var AnimationLooper = pc.createScript('animationLooper');

// initialize code called once per entity
AnimationLooper.prototype.initialize = function() {
    this.app.keyboard.on(pc.EVENT_KEYDOWN, this.onKeyDown, this);
};

// update code called every frame
AnimationLooper.prototype.update = function(dt) {
    
};

AnimationLooper.prototype.onKeyDown = function(event) {
    
    if (event.key === pc.KEY_R ) {
        this.entity.animation.play("walk.glb", 0.2);
    } else if (event.key === pc.KEY_E ) {
        this.entity.animation.play("idle.glb", 0.2);
    } else if(event.key === pc.KEY_W ) {
        this.entity.animation.play("Wave.glb", 0.2);
    }
};
// swap method called for script hot-reloading
// inherit your script state here
// AnimationLooper.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// https://developer.playcanvas.com/en/user-manual/scripting/