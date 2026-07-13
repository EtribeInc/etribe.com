var Version = pc.createScript('version');

Version.attributes.add("configFile",{
    title: 'Config JSON File',
    type: 'asset',
    assetType: 'json'
});

// initialize code called once per entity
Version.prototype.initialize = function() {
    this.config = this.configFile.resource;
    this.entity.element.text = "v"+this.config.version;
};

// update code called every frame
Version.prototype.update = function(dt) {
    
};

// swap method called for script hot-reloading
// inherit your script state here
// Version.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// https://developer.playcanvas.com/en/user-manual/scripting/