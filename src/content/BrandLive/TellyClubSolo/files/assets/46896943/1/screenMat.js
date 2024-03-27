var TvScreen = pc.createScript('screenMat');

TvScreen.attributes.add('screenMaterial', {
    title: 'Screen Material',
    description: 'The screen material of the TV that displays the video texture.',
    type: 'asset',
    assetType: 'material'
});

TvScreen.attributes.add('placeholderTexture', {
    title: 'Placeholder Texture',
    description: 'The screen texturewhen no video is playing.',
    type: 'asset',
    assetType: 'texture'
});

TvScreen.attributes.add('playEvent', {
    title: 'Play Event',
    description: 'Set the TV screen material emissive map on this event.',
    type: 'string',
    default: ''
});

// initialize code called once per entity
TvScreen.prototype.initialize = function () {
    this.videoReady = false;

    // as soon as the play event is fired set texture of material to videoTexture
    this.entity.script.localVideo.on(this.playEvent, function (canvas) {
        // Create a texture to hold the video frame data
        this.videoTexture = new pc.Texture(this.app.graphicsDevice, {
            format: pc.PIXELFORMAT_R8_G8_B8,
            minFilter: pc.FILTER_LINEAR_MIPMAP_LINEAR,
            magFilter: pc.FILTER_LINEAR,
            addressU: pc.ADDRESS_CLAMP_TO_EDGE,
            addressV: pc.ADDRESS_CLAMP_TO_EDGE,
            mipmaps: true
        });
        this.videoTexture.setSource(canvas);

        var material = this.screenMaterial.resource;
        material.emissiveMap = this.videoTexture;
        material.update();
        this.videoReady = true;
    }, this);

    let callback = (bool) => {
        var material = this.screenMaterial.resource;
        material.emissiveMap = bool ? this.videoTexture : this.placeholderTexture.resource;
        material.update();
    };

    this.app.on("video:toggle", callback, this);

    this.on("destroy", () => {
        this.app.off("video:toggle", callback);
    });
};
TvScreen.prototype.update = function (dt) {
    if (this.videoReady) {
        // Transfer the latest video frame to the video texture
        this.videoTexture.upload();
    }

};
