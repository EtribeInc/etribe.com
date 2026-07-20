var BlockInput = pc.createScript('blockInput');

// initialize code called once per entity
BlockInput.prototype.initialize = function() {
    this.entity.element.on('mousedown', function(e) {
        e.stopPropagation();
    }, this);
    this.entity.element.on('mouseup', function(e) {
        e.stopPropagation();
    }, this);
    this.entity.element.on('touchstart', function(e) {
        e.stopPropagation();
    }, this);
     this.entity.element.on('touchend', function(e) {
        e.stopPropagation();
    }, this);
};

// update code called every frame
BlockInput.prototype.update = function(dt) {
    
};

// swap method called for script hot-reloading
// inherit your script state here
// BlockMouseInput.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// http://developer.playcanvas.com/en/user-manual/scripting/