var StencilMask = pc.createScript('stencilMask');

StencilMask.attributes.add('maskID', {
    title: 'Mask ID',
    description: 'This mask id should be an integer between 0 and 7, as it relates as the power of 2 to the actual mask id.',
    type: 'number',
    default: 0,
    min: 0,
    max: 7,
    precision: 0,
});


StencilMask.prototype.initialize = function () {    
    this._setStencil();
    this.on('attr', this._attributeReloading);
};


StencilMask.prototype._setStencil = function () {
    var mask = Math.pow(2, this.maskID);

    var stencil = new pc.StencilParameters({
        readMask: mask,
        writeMask: mask,
        ref: mask,
        zpass: pc.STENCILOP_REPLACE
    });

    this._setModelAsStencil(stencil);
};


StencilMask.prototype._setModelAsStencil = function (stencilParameter) {
    var meshInstances = null;

    if (this.entity.render) {
        meshInstances = this.entity.render.meshInstances;
    }

    if (this.entity.model) {
        meshInstances = this.entity.model.meshInstances;
    }

    if (meshInstances && meshInstances.length > 0) {
        var mat = meshInstances[0].material.clone();
        mat.stencilBack = mat.stencilFront = stencilParameter;

        // Don't write to color, only to stencil
        mat.redWrite = mat.greenWrite = mat.blueWrite = mat.alphaWrite = false;
        meshInstances[0].material = mat;
        mat.update();
    }
};


StencilMask.prototype.swap = function (old) {
    this.on('attr', this._attributeReloading);
};


StencilMask.prototype._attributeReloading = function (name, value, prev) {
    this._setStencil();
};