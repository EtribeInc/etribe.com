var CharacterSelect = pc.createScript('characterSelect');

CharacterSelect.attributes.add('cycleLeftBtn', { type: 'entity', title: 'Cycle Left Button' });
CharacterSelect.attributes.add('cycleRightBtn', { type: 'entity', title: 'Cycle Right Button' });
CharacterSelect.attributes.add('cycleTime', { type: 'number', title: 'Cycle Time', default: 0.1 });
CharacterSelect.attributes.add('disableScriptsOnEntities', {
    type: 'entity',
    title: 'Disable Scripts on Entities',
    array: true
});

// initialize code called once per entity
CharacterSelect.prototype.initialize = function () {
    this.modelHandler = this.entity.script.modelHandler;
    this.activeIndex = getURLParameter("char") ? parseInt(getURLParameter("char")) : 0;
    this.activeIndex = !this.activeIndex || this.activeIndex >= this.modelHandler.playerModels.length || this.activeIndex < 0 ? 0 : this.activeIndex;
    setURLParameter("char", this.activeIndex);

    this.model = this.modelHandler.instantiateModel(this.activeIndex);
    this.isExiting = false;

    this.cycleLeftBtn.on('cycle:left', function (event) {
        this.cycle(true);
    }, this);
    this.cycleRightBtn.on('cycle:right', function (event) {
        this.cycle(false);
    }, this);
    this.app.on('characters:directSelect', function (index) { this.directSelect(index); }, this);
    //this.app.on('characters:directSelect', function(index) { this.directSelect(index); }, this);
    this.app.on('tubeExitHandler:start', function (event) {
        this.isExiting = true;
        if (this.disableScriptsOnEntities && this.disableScriptsOnEntities.length > 0) {
            console.log("this.disableScriptsOnEntities.length = " + this.disableScriptsOnEntities.length);
            for (var i = 0; i < this.disableScriptsOnEntities.length; i++) {
                console.log("this.disableScriptsOnEntities[" + i + "] = " + this.disableScriptsOnEntities[i].name);
                this.disableScriptsOnEntities[i].script.enabled = false;
            }
        }
    }, this);
    this.app.keyboard.on(pc.EVENT_KEYDOWN, this.onKeyDown, this);

    this.entity.on('destroy', () => {
        this.app.keyboard.off(pc.EVENT_KEYDOWN, this.onKeyDown);
        this.app.off('tubeExitHandler:start', function (event) { this.isExiting = true; }, this);
    }, this);
};

CharacterSelect.prototype.postInitialize = function () {
    this.previousIndex = -1;
    this.app.fire("characters:switch", this.activeIndex, this.previousIndex);
};

CharacterSelect.prototype.onKeyDown = function (event) {
    if (this.isExiting) return;
    switch (event.key) {
        case pc.KEY_LEFT:
            this.cycle(true);
            break;
        case pc.KEY_RIGHT:
            this.cycle(false);
            break;
    }
};

CharacterSelect.prototype.update = function (dt) {

};

CharacterSelect.prototype.cycle = function (backwards) {
    this.previousIndex = this.activeIndex;
    this.activeIndex += backwards ? -1 : 1;

    if (this.activeIndex < 0)
        this.activeIndex = this.modelHandler.playerModels.length - 1;
    else if (this.activeIndex >= this.modelHandler.playerModels.length)
        this.activeIndex = 0;

    this.directSelect(this.activeIndex);
};

CharacterSelect.prototype.directSelect = function (index) {
    if (this.isExiting) return;
    var self = this;
    if (this.activeIndex != index)  // not cycling, set the previous index before updating the active index
        this.previousIndex = this.activeIndex;
    this.activeIndex = index;

    if (this.activeIndex < 0)
        this.activeIndex = this.modelHandler.playerModels.length - 1;
    else if (this.activeIndex >= this.modelHandler.playerModels.length)
        this.activeIndex = 0;

    setURLParameter("char", this.activeIndex);

    if (this.model) {
        var tweenOut = this.model.tween(this.model.getLocalScale()).to({ x: 0, y: 0, z: 0 }, self.cycleTime, pc.Linear);
        tweenOut.on('complete', function () {
            self.model = self.modelHandler.instantiateModel(self.activeIndex);
            self.model.setLocalScale(0, 0, 0);
            var tweenIn = self.model.tween(self.model.getLocalScale()).to({ x: 1, y: 1, z: 1 }, self.cycleTime, pc.Linear);
            tweenIn.start();
        });
        tweenOut.start();
    } else {
        this.model = this.modelHandler.instantiateModel(this.activeIndex);
        this.model.setLocalScale(0, 0, 0);
        var tweenIn = this.model.tween(this.model.getLocalScale()).to({ x: 1, y: 1, z: 1 }, self.cycleTime, pc.Linear);
        tweenIn.start();
    }
    this.app.fire("characters:switch", this.activeIndex, this.previousIndex);
};
