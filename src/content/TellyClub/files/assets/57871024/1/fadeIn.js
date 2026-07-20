var FadeIn = pc.createScript('fadeIn');

FadeIn.attributes.add('eventName', {
    title: 'Event Name',
    description: 'Event to listen to.',
    type: 'string'
});

FadeIn.attributes.add('eventTargetEntity', {
    title: 'Event Target Entity',
    description: 'Entity listening for the event on.',
    type: 'entity'
});

FadeIn.attributes.add('fadeOnStart', {
    title: 'Fade On Start',
    description: 'Directly do the fade without listening to an event',
    type: 'boolean'
});

FadeIn.attributes.add('fadeDuration', {
    title: 'Fade Duration',
    description: 'Duration the fade is being done.',
    type: 'number'
});

FadeIn.attributes.add('fadeFrom', {
    title: 'Fade From Value',
    description: 'Value the fade starts from',
    type: 'number'
});

FadeIn.attributes.add('fadeTo', {
    title: 'Fade To Value',
    description: 'Value the fade ends at',
    type: 'number'
});

FadeIn.attributes.add('eventForCancel', {
    title: 'Cancel Event',
    description: 'Event for cancel.',
    type: 'string'
});

FadeIn.attributes.add('eventForCancelEntity', {
    title: 'Cancel Event Entity',
    description: 'Entity listening for the event on.',
    type: 'entity'
});

// initialize code called once per entity
FadeIn.prototype.initialize = function () {
    var soundSrc = this.entity.sound;
    var data = { value: this.fadeFrom };
    var entity = this.eventTargetEntity != null ? this.eventTargetEntity : this.entity;

    var ease = pc.SineInOut;

    if (this.fadeOnStart) {
        this.fade = this.app.tween(data).to({ value: this.fadeTo }, this.fadeDuration, ease).onUpdate(function (dt) {
            soundSrc.volume = data.value;
        });
        this.fade.start();
    } else {
        entity.on(this.eventName, () => {
            this.fade = this.app.tween(data).to({ value: this.fadeTo }, this.fadeDuration, ease).onUpdate(function (dt) {
                soundSrc.volume = data.value;
            });
            this.fade.start();
        }, this);
    }

    if (this.eventForCancel) {
        let target = this.eventForCancelEntity ? this.eventForCancelEntity : this.app;
        target.on(this.eventForCancel, () => { if (this.fade) this.fade.stop(); }, this);
        this.entity.on('destroy', () => target.off(this.eventForCancel));
    }
};

// update code called every frame
FadeIn.prototype.update = function (dt) {

};

// swap method called for script hot-reloading
// inherit your script state here
// FadeIn.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// https://developer.playcanvas.com/en/user-manual/scripting/