var AlphaFade = pc.createScript('alphaFade');


AlphaFade.attributes.add('fadeInEvent', {
    title: 'Fade In Event Name',
    description: 'Event to listen to.',
    type: 'string'
});

AlphaFade.attributes.add('fadeOutEvent', {
    title: 'Fade Out Event Name',
    description: 'Event to listen to.',
    type: 'string'
});

AlphaFade.attributes.add('eventTargetEntity', {
    title: 'Event Target Entity',
    description: 'Entity listening for the event on.',
    type: 'entity'
});

AlphaFade.attributes.add('fadeDuration', {
    title: 'Fade Duration',
    description: 'Duration the fade is being done.',
    type: 'number'
});

// initialize code called once per entity
AlphaFade.prototype.initialize = function () {
    var element = this.entity.element;
    var data = { value: this.fadeFrom };
    var entity = this.eventTargetEntity != null ? this.eventTargetEntity : this.app;
    this.material = this.entity.model.material;

    console.log(this.material);

    var ease = pc.SineInOut;

    entity.on(this.fadeInEvent, () => {
        var data = { value: 0 };
        this.app.tween(data).to({ value: 1 }, this.fadeDuration, ease).on('update', function (dt) {
            this.material.opacity = data.value;
            this.material.update();
        }, this).start();
    }, this);

    entity.on(this.fadeOutEvent, () => {
        var data = { value: 1 };
        this.app.tween(data).to({ value: 0 }, this.fadeDuration, ease).on('update', function (dt) {
            this.material.opacity = data.value;
            this.material.update();
        }, this).start();
    }, this);
};

// update code called every frame
AlphaFade.prototype.update = function (dt) {

};

// swap method called for script hot-reloading
// inherit your script state here
// AlphaFade.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// https://developer.playcanvas.com/en/user-manual/scripting/