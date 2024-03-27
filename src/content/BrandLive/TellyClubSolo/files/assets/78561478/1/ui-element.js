var UiElement = pc.createScript('uiElement');

UiElement.attributes.add('playEvent', {
    title: 'Play Event',
    description: 'Set the TV screen material emissive map on this event.',
    type: 'string',
    default: ''
});

// initialize code called once per entity
UiElement.prototype.initialize = function() {
    this.app.on(this.playEvent, function (videoTexture) {
        this.entity.element.texture = videoTexture;
    }, this);
};
