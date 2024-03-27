var UiShowHide = pc.createScript('uiShowHide');

UiShowHide.attributes.add('srcEntity',{
    title: 'Event Source Entity',
    type: 'entity'
});

UiShowHide.attributes.add('uiEvent', {
    title: 'Event Name',
    description: 'Event name to listen to for hiding and showing this element.',
    type: 'string',
    default: "ui:element"
});

UiShowHide.attributes.add('startingState', {
    title: 'Starting State',
    description: 'Controls if the ui is hidden or shown on scene start.',
    type: 'boolean',
    default: true
});

UiShowHide.prototype.showHide = function(bool) {
    this.entity.enabled = bool;
};

UiShowHide.prototype.toggle = function() {
    this.showHide(!this.entity.enabled);
};

// initialize code called once per entity
UiShowHide.prototype.initialize = function() {
    this.srcEntity.on(this.uiEvent, this.toggle, this);
    
    this.entity.on('destroy', function() {
        this.entity.off(this.uiEvent, this.toggle);
    });
    
    this.showHide(this.startingState);
};

// update code called every frame
UiShowHide.prototype.update = function(dt) {
    
};



// swap method called for script hot-reloading
// inherit your script state here
// UiShowHide.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// https://developer.playcanvas.com/en/user-manual/scripting/