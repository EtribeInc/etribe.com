var FadeOut = pc.createScript('fadeOut');

FadeOut.attributes.add('eventName', {
    title: 'Event Name',
    description: 'Event to listen to.',
    type: 'string'
});

FadeOut.attributes.add('eventTargetEntity', {
    title: 'Event Target Entity',
    description: 'Entity listening for the event on.',
    type: 'entity'
});

FadeOut.attributes.add('fadeDuration', {
    title: 'Fade Duration',
    description: 'Duration the fade is being done.',
    type: 'number'
});

FadeOut.attributes.add('fadeFrom', {
    title: 'Fade From Value',
    description: 'Value the fade starts from',
    type: 'number'
});

FadeOut.attributes.add('fadeTo', {
    title: 'Fade To Value',
    description: 'Value the fade ends at',
    type: 'number'
});

FadeOut.attributes.add('eventForCancel', {
    title: 'Cancel Event',
    description: 'Event for cancel.',
    type: 'string'
});

// initialize code called once per entity
FadeOut.prototype.initialize = function () {
    var soundSrc = this.entity.sound;
    var data = { value: this.fadeFrom };
    var entity = this.eventTargetEntity != null ? this.eventTargetEntity : this.app;

    var ease = pc.SineInOut;

    entity.on(this.eventName, () => {
        this.fade = this.app.tween(data).to({ value: this.fadeTo }, this.fadeDuration, ease);
        this.fade.on('update', function (dt) {
            soundSrc.volume = data.value;
        });
        this.fade.start();
    }, this);

    if (this.eventForCancel) {
        entity.on(this.eventForCancel, () => { if (this.fade) this.fade.stop(); }, this);
        this.entity.on('destroy', () => entity.off(this.eventForCancel));

    }
};

// update code called every frame
FadeOut.prototype.update = function (dt) {

};

// swap method called for script hot-reloading
// inherit your script state here
// FadeOut.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// https://developer.playcanvas.com/en/user-manual/scripting/