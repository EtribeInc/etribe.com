var StencilSubject = pc.createScript('stencilSubject');

StencilSubject.attributes.add('showInside', {
    title: 'Show',
    description: 'Determines whether this entity will be shown inside or outside of a mask with the given ID.\n' +
        'If multiple ID\'s are passed: \n' +
        '- If \'Inside\' is chosen, only the parts which are inside all of the given IDs will be shown.\n' +
        '- If \'Outside\' is chosen, the parts which are outside any of the given IDs will be shown.\n',
    type: 'boolean',
    default: true,
    enum: [
        { 'Inside': true },
        { 'Outside': false },
    ],
});

StencilSubject.attributes.add('maskIDs', {
    title: 'Mask IDs',
    description: 'These ID\'s have to be between 0 and 7.',
    type: 'number',
    array: true,
    default: [0],
});


StencilSubject.prototype.postInitialize = function () {
    var i = 0;
    var j = 0;
    this._meshInstances = [];
    
    var renders = this.entity.findComponents('render');

    for (i = 0; i < renders.length; ++i) {
        meshInstances = renders[i].meshInstances;
        for (j = 0; j < meshInstances.length; j++) {
            this._meshInstances.push(meshInstances[j]);
        }
    }

    var models = this.entity.findComponents('model');
    for (i = 0; i < models.length; ++i) {
        meshInstances = models[i].meshInstances;
        for (j = 0; j < meshInstances.length; j++) {
            this._meshInstances.push(meshInstances[j]);
        }
    }

    this._setStencil();

    this.on('attr', this._attributeReloading);
};


StencilSubject.prototype._setStencil = function () {
    if (!this._addMaskIDs()) {
        return;
    }

    var stencil = new pc.StencilParameters({
        readMask: this.maskID,
        writeMask: this.maskID,
        ref: this.maskID,
        func: this.showInside ? pc.FUNC_EQUAL : pc.FUNC_NOTEQUAL,
    });

    this._setStencilForModel(stencil);
    this._setStencilForParticle(stencil);
    this._setStencilForSpine(stencil);
    this._setStencilForSprite(stencil);
};


StencilSubject.prototype._addMaskIDs = function () {
    this.maskID = 0;

    // Check if the mask has the right length
    if (this.maskIDs.length > 8) {
        return false;
    }

    for (var i = 0; i < this.maskIDs.length; ++i) {
        var id = Math.floor(this.maskIDs[i]);

        if (id >= 0 && id < 8) {
            this.maskID += Math.pow(2, id);
        }
        else {
            // Check if the mask has the right length
            return false;
        }
    }

    return true;
};


StencilSubject.prototype._setStencilForModel = function (stencil) {
    for (var i = 0; i < this._meshInstances.length; i++) {
        this._meshInstances[i].layer = this.app.scene.layers.getLayerByName('Before World');
        var mat = this._meshInstances[i].material.clone();
        mat.stencilBack = mat.stencilFront = stencil;
        this._meshInstances[i].material = mat;
    }
};


StencilSubject.prototype._setStencilForParticle = function (stencil) {
    if (this.entity.particlesystem) {
        this.entity.particlesystem.emitter.meshInstance.layer = this.app.scene.layers.getLayerByName('Before World');
        var mat = this.entity.particlesystem.emitter.material;
        mat.stencilBack = mat.stencilFront = stencil;
    }
};


StencilSubject.prototype._setStencilForSpine = function (stencil) {
    if (this.entity.spine) {
        var model = this.entity.spine.spine._model;

    for (var i = 0; i < this._meshInstances.length; i++) {
            this._meshInstances[i].layer = this.app.scene.layers.getLayerByName('Before World');
            var mat = this._meshInstances[i].material;
            mat.stencilBack = mat.stencilFront = stencil;
        }
    }
};


StencilSubject.prototype._setStencilForSprite = function (stencil) {
    if (this.entity.sprite) {
        // Waring: Private API
        var model = this.entity.sprite._model;

        model.meshInstances[0].layer = this.app.scene.layers.getLayerByName('Before World');
        var mat = model.meshInstances[0].material.clone();
        mat.stencilBack = mat.stencilFront = stencil;
        model.meshInstances[0].material = mat;
    }
};


StencilSubject.prototype.swap = function (stencil) {
    this.on('attr', this._attributeReloading);
};


StencilSubject.prototype._attributeReloading = function (name, value, prev) {
    this._setStencil();
};