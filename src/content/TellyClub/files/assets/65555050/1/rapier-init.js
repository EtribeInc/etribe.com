var RapierInit = pc.createScript('rapierInit');

RapierInit.attributes.add("gravity", {
    type: "vec3",
    default: [0,-9.81,0]
});

// initialize code called once per entity
RapierInit.prototype.initialize = async function() {
    let RAPIER = await import("https://cdn.skypack.dev/@dimforge/rapier3d-compat");
    await RAPIER.init();
    console.log("Rapier initialized!");

    console.log(this.gravity);

    this.world = new RAPIER.World({ x: this.gravity.x, y: this.gravity.y, z: this.gravity.z });

    this.app.fire("rapier:initialized", RAPIER, this.world);
    this.physicsLoop(this);
};

// update code called every frame
RapierInit.prototype.update = function(dt) {
    if(this.world){
        //this.world.step();
    }
};

RapierInit.prototype.physicsLoop = function(context) {
    if(context.world){
        context.world.step();
    }
    console.log("Physiscs Step.");
    setTimeout(()=>context.physicsLoop(context), 16);
};

// swap method called for script hot-reloading
// inherit your script state here
// RapierInit.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// https://developer.playcanvas.com/en/user-manual/scripting/