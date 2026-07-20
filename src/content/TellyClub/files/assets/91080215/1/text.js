var Text = pc.createScript('text');

Text.attributes.add('text', { type: 'string', default: 'Hello World' });

Text.prototype.initialize = function () {
    // Create a canvas to do the text rendering
    this.canvas = document.createElement('canvas');
    this.canvas.height = 128;
    this.canvas.width = 1024;
    this.context = this.canvas.getContext('2d');

    this.texture = new pc.Texture(this.app.graphicsDevice, {
        format: pc.PIXELFORMAT_R8_G8_B8,
        autoMipmap: true
    });
    this.texture.setSource(this.canvas);
    this.texture.minFilter = pc.FILTER_LINEAR_MIPMAP_LINEAR;
    this.texture.magFilter = pc.FILTER_LINEAR;
    this.texture.addressU = pc.ADDRESS_CLAMP_TO_EDGE;
    this.texture.addressV = pc.ADDRESS_CLAMP_TO_EDGE;

    this.updateText();

    this.material = this.entity.model.material.clone();
    this.entity.model.material = this.material;
    this.material.emissiveMap = this.texture;
    this.material.opacityMap = this.texture;
    this.material.blendType = pc.BLEND_NORMAL;
    this.material.update();

    // this.on('attr', function (name, value, prev) {
    //     this.updateText();
    // });
    this.on('destroy', () => {
        this.material.destroy();
        this.texture.destroy();
    }, this);
};

Text.prototype.setText = function (text) {
    this.text = text;
    this.updateText();
};

Text.prototype.updateText = function () {
    var ctx = this.context;
    var w = ctx.canvas.width;
    var h = ctx.canvas.height;

    this.text = this.text.length > 20 ? this.text.slice(0, 20) + "..." : this.text;
    // Clear the context to transparent
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, w, h);

    // Write white text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 70px Verdana';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.text, w / 2, h / 2);

    // Copy the canvas into the texture
    this.texture.upload();
};