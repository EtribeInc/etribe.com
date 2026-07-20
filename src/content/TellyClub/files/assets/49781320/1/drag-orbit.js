var DragOrbit = pc.createScript('dragOrbit');

DragOrbit.attributes.add('dragSpeed', {type: 'number', default: 0.1, title: 'Drag Speed'});

// initialize code called once per entity
DragOrbit.prototype.initialize = function() {
    this.mouseDown = false;
    this.touchDown = false;
    this.touchStart = [0,0];
    
    this.app.mouse.on(pc.EVENT_MOUSEMOVE, this.onMouseMove, this);
    this.app.mouse.on(pc.EVENT_MOUSEDOWN, this.onMouseDown, this);
    this.app.mouse.on(pc.EVENT_MOUSEUP, ()=>{this.mouseDown = false;}, this);
    
    if (this.app.touch) {
        this.app.touch.on(pc.EVENT_TOUCHMOVE, this.onTouchMove, this);
        this.app.touch.on(pc.EVENT_TOUCHSTART, this.onTouchStart, this);
        this.app.touch.on(pc.ENVET_TOUCHEND, this.onTouchEnd, this);
    }
};

// update code called every frame
DragOrbit.prototype.update = function(dt) {
    
};

DragOrbit.prototype.onMouseDown = function(event) {
    //event.event.stopPropagation();
    this.mouseDown = true;
};

DragOrbit.prototype.onMouseMove = function(event) {
    if(this.mouseDown){
        this.entity.rotate(0,-event.dx*this.dragSpeed,0);
    }
};

DragOrbit.prototype.onTouchMove = function(event) {
    if(this.touchDown && event.touches.length === 1){
        this.entity.rotate(0,(this.lastTouch?this.lastTouch.x - event.touches[0].x:0)*this.dragSpeed,0);
        this.lastTouch = event.touches[0];
    }
};

DragOrbit.prototype.onTouchStart = function(event) {
    if(event.touches.length === 1){
        this.touchDown = true;
        this.lastTouch = event.touches[0];
    }
};

DragOrbit.prototype.onTouchEnd = function(event) {
    this.touchDown = false;
    this.lastTouch = null;
};
// swap method called for script hot-reloading
// inherit your script state here
// DragOrbit.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// https://developer.playcanvas.com/en/user-manual/scripting/