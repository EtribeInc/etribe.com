var UiEventButton = pc.createScript('uiEventButton');

UiEventButton.attributes.add('targetEntity', {
    title: 'Target Entity',
    description: 'Target Entity the button event is fired on.',
    type: 'entity'
});

UiEventButton.attributes.add('eventName', {
    title: 'Event Name',
    description: 'Event that is fired on the target entity.',
    type: 'string'
});

// initialize code called once per entity
UiEventButton.prototype.initialize = function () {
    var self = this;
    self.eventTarget = this.targetEntity ? this.targetEntity : this.app;
    this.entity.element.on('click', function (event) {
        console.log("click");
        self.eventTarget.fire(self.eventName);
    }, this);
};

// update code called every frame
UiEventButton.prototype.update = function (dt) {

};

// swap method called for script hot-reloading
// inherit your script state here
// UiEventButton.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// https://developer.playcanvas.com/en/user-manual/scripting/