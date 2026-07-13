var Preload = pc.createScript('preload');

// initialize code called once per entity
Preload.prototype.initialize = function () {
    if (!getURLParameter("char")) {
        this.entity.script.sceneChanger.loadScene("00_Airlock");
    } else {
        this.app.fire("sceneChange:loadScene");
    }
};

// update code called every frame
Preload.prototype.update = function (dt) {

};

// swap method called for script hot-reloading
// inherit your script state here
// Preload.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// https://developer.playcanvas.com/en/user-manual/scripting/