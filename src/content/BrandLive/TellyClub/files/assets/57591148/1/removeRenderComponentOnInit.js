var RemoveRenderComponentOninit = pc.createScript('removeRenderComponentOninit');

// initialize code called once per entity
RemoveRenderComponentOninit.prototype.initialize = function() {
    this.entity.removeComponent("render");
};

// update code called every frame
RemoveRenderComponentOninit.prototype.update = function(dt) {
    
};
