var PlayerSpawner = pc.createScript('playerSpawner');

PlayerSpawner.attributes.add('playerTemplate', {
    type: 'asset',
    asssetType: "template",
    name: "Player Template"
});

// initialize code called once per entity
PlayerSpawner.prototype.initialize = function () {

};

// update code called every frame
PlayerSpawner.prototype.update = function (dt) {

};

PlayerSpawner.prototype.spawn = function (modelindex, isAdd) {
    var instance = this.playerTemplate.resource.instantiate();
    this.entity.addChild(instance);
    var modelHandler = instance.script.get('modelHandler');
    var model = modelHandler.instantiateModel(modelindex);
    if (isAdd)
        this.app.fire("tubeEntrance:networkedPlayer", model);

    return instance;
};
// swap method called for script hot-reloading
// inherit your script state here
// PlayerSpawner.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// https://developer.playcanvas.com/en/user-manual/scripting/