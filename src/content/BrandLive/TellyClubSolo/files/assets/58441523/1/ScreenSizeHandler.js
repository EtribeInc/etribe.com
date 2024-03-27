var ScreenSizeHandler = pc.createScript('screenSizeHandler');

ScreenSizeHandler.attributes.add('mobileEntities', {
    type: 'entity',
    name: "Mobile Entities",
    description: "Entities that will be enabled on small screens.",
    array: true
});

ScreenSizeHandler.attributes.add('desktopEntities', {
    type: 'entity',
    name: "Desktop Entities",
    description: "Entities that will be enabled on large screens.",
    array: true
});

ScreenSizeHandler.attributes.add('breakPoint', {
    type: 'number',
    name: "Break Point",
    description: "Screen width in pixels at which screen will be considered large / desktop.",
    default: 900
});

// initialize code called once per entity
ScreenSizeHandler.prototype.initialize = function() {
    let mobile = document.documentElement.clientWidth > this.breakPoint ? false : true;

    this.mobileEntities.forEach(element => {
        if(!mobile)
            element.destroy();
        else
            element.enabled = mobile;
    });
    
    this.desktopEntities.forEach(element => {
        if(mobile)
            element.destroy();
        else
            element.enabled = !mobile;
    });
};

// update code called every frame
ScreenSizeHandler.prototype.update = function(dt) {

};

// swap method called for script hot-reloading
// inherit your script state here
// ScreenSizeHandler.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// https://developer.playcanvas.com/en/user-manual/scripting/