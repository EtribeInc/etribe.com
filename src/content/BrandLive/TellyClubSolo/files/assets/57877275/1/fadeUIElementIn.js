var FadeUiIn = pc.createScript('fadeUiIn');

FadeUiIn.attributes.add('eventName', {
    title: 'Event Name',
    description: 'Event to listen to.',
    type: 'string'
});

FadeUiIn.attributes.add('eventTargetEntity', {
    title: 'Event Target Entity',
    description: 'Entity listening for the event on.',
    type: 'entity'
});

FadeUiIn.attributes.add('fadeOnInit', {
    title: 'Fade On Init',
    description: 'Directly do the fade without listening to an event',
    type: 'boolean'
});

FadeUiIn.attributes.add('fadeDuration', {
    title: 'Fade Duration',
    description: 'Duration the fade is being done.',
    type: 'number'
});

FadeUiIn.attributes.add('fadeFrom', {
    title: 'Fade From Value',
    description: 'Value the fade starts from',
    type: 'number'
});

FadeUiIn.attributes.add('fadeTo', {
    title: 'Fade To Value',
    description: 'Value the fade ends at',
    type: 'number'
});

FadeUiIn.attributes.add('onCompleteEvent', {
    title: 'On Complete Event',
    description: 'Event fired after UI fade.',
    type: 'string'
});

// initialize code called once per entity
FadeUiIn.prototype.initialize = function () {
    var element = this.entity.element;
    var data = { value: this.fadeFrom };
    var entity = this.eventTargetEntity != null ? this.eventTargetEntity : this.app;

    var ease = pc.SineInOut;

    if (this.fadeOnInit) {
        this.app.tween(data).to({ value: this.fadeTo }, this.fadeDuration, ease).onUpdate(function (dt) {
            element.opacity = data.value;
        }).on('complete', function () {
            if (this.onCompleteEvent != "")
                this.app.fire(this.onCompleteEvent);
        }, this).start();
    } else {
        entity.on(this.eventName, () => {
            var data = { value: this.fadeFrom };
            this.app.tween(data).to({ value: this.fadeTo }, this.fadeDuration, ease).start().onUpdate(function (dt) {
                element.opacity = data.value;
            }).on('complete', function () {
                this.app.fire(this.onCompleteEvent);
            }, this);
        }, this);
    }

};

// update code called every frame
FadeUiIn.prototype.update = function (dt) {

};

// swap method called for script hot-reloading
// inherit your script state here
// FadeUiIn.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// https://developer.playcanvas.com/en/user-manual/scripting/