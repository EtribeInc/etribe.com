var AirlockDirectSelect = pc.createScript('airlockDirectSelect');

AirlockDirectSelect.attributes.add('characterIndex', {type: 'number', title: 'CharacterSelect Index'});

// initialize code called once per entity
AirlockDirectSelect.prototype.initialize = function() {
    var self = this;
    this.characterModel = this.entity.parent;
    this.cycleTime = this.app.root.findByName('CharacterSelector').script.characterSelect.cycleTime;
    
    this.entity.on("raycast:hit", ()=>{
        this.app.fire("characters:directSelect", this.characterIndex);
    }, this);
    
    this.app.on("characters:switch", function(activeIndex, previousIndex) {
        if (self.characterIndex == activeIndex)
            self.shrink();
        else if (self.characterIndex == previousIndex)
            self.grow();
    }, self);
    
    this.shelfScale = new pc.Vec3();
    this.shelfScale.copy(this.characterModel.getLocalScale());
    
    this.entity.on("destroy", ()=>this.entity.off(), this);
};

AirlockDirectSelect.prototype.shrink = function() {
    var tweenShrink = this.characterModel.tween(this.characterModel.getLocalScale()).to({x: 0.001, y: 0.001, z: 0.001}, this.cycleTime, pc.Linear);
    tweenShrink.start();
};

AirlockDirectSelect.prototype.grow = function() {
    var tweenGrow = this.characterModel.tween(this.characterModel.getLocalScale()).to(this.shelfScale, this.cycleTime, pc.Linear);
    tweenGrow.start();
};

// update code called every frame
AirlockDirectSelect.prototype.update = function(dt) {
    
};



// swap method called for script hot-reloading
// inherit your script state here
// AirlockDirectSelect.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// http://developer.playcanvas.com/en/user-manual/scripting/