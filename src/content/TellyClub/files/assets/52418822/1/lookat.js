var Lookat = pc.createScript('lookat');

Lookat.attributes.add('target', {type: 'entity', title: 'Target Entity'});
Lookat.attributes.add('invertForward', {type: 'boolean', title: 'Invert Forward', default: false});
Lookat.attributes.add("axisLock", {
    title: "Axis Lock",
    type: "json",
    schema: [{
        name: "x",
        type: "boolean",
        default: false
    },{
        name: "y",
        type: "boolean",
        default: false
    },{
        name: "z",
        type: "boolean",
        default: false
    }]
});

// initialize code called once per entity
Lookat.prototype.initialize = function() {
    
};

// update code called every frame
Lookat.prototype.update = function(dt) {
    let pos = this.entity.getPosition();
    let targetPos = this.target.getPosition();
    let targetX = !this.axisLock.x? pos.x: targetPos.x;
    let targetY = !this.axisLock.y? pos.y: targetPos.y;
    let targetZ = !this.axisLock.z? pos.z: targetPos.z;

    this.entity.lookAt(targetX,targetY, targetZ);
    
    if(this.invertForward)
        this.entity.rotate(0,180,0);
    
};

// swap method called for script hot-reloading
// inherit your script state here
// Lookat.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// https://developer.playcanvas.com/en/user-manual/scripting/