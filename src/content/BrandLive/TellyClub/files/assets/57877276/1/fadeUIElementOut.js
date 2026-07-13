var FadeUiOut = pc.createScript('fadeUiOut');

FadeUiOut.attributes.add('eventName', {
    title: 'Event Name',
    description: 'Event to listen to.',
    type: 'string'
});

FadeUiOut.attributes.add('eventTargetEntity', {
    title: 'Event Target Entity',
    description: 'Entity listening for the event on.',
    type: 'entity'
});

FadeUiOut.attributes.add('fadeOnInit', {
    title: 'Fade On Init',
    description: 'Directly do the fade without listening to an event',
    type: 'boolean'
});

FadeUiOut.attributes.add('fadeDuration', {
    title: 'Fade Duration',
    description: 'Duration the fade is being done.',
    type: 'number'
});

FadeUiOut.attributes.add('fadeFrom', {
    title: 'Fade From Value',
    description: 'Value the fade starts from',
    type: 'number'
});

FadeUiOut.attributes.add('fadeTo', {
    title: 'Fade To Value',
    description: 'Value the fade ends at',
    type: 'number'
});

// initialize code called once per entity
FadeUiOut.prototype.initialize = function () {
    var element = this.entity.element;
    var data = { value: this.fadeFrom };
    var entity = this.eventTargetEntity != null ? this.eventTargetEntity : this.entity;

    var ease = pc.SineInOut;

    if (this.fadeOnInit) {
        this.app.tween(data).to({ value: this.fadeTo }, this.fadeDuration, ease).onUpdate(function (dt) {
            element.opacity = data.value;
        }).start();
    } else {
        entity.on(this.eventName, () => {
            var data = { value: this.fadeFrom };

            this.app.tween(data).to({ value: this.fadeTo }, this.fadeDuration, ease).onUpdate(function (dt) {
                element.opacity = data.value;
            }).start();
        }, this);
    }
};

// update code called every frame
FadeUiOut.prototype.update = function (dt) {

};

// swap method called for script hot-reloading
// inherit your script state here
// FadeUiOut.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// https://developer.playcanvas.com/en/user-manual/scripting/