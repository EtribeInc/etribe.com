var MenuBinder = pc.createScript('menuBinder');

// initialize code called once per entity
MenuBinder.prototype.initialize = function() {
    
};

// update code called every frame
MenuBinder.prototype.update = function(dt) {
    
};

MenuBinder.prototype.bindEvents = function(element) {
    var self = this;
    // example
    //
    // get button element by class
    var button = element.querySelector('#burger');
    var overlay = element.querySelector('#overlay');
    // if found
    if (button) {
        // add event listener on `click`
        button.addEventListener('click', function() {
            if(overlay.classList.contains('active'))
                overlay.classList.remove('active');
            else 
                overlay.classList.add('active');
        }, false);
    }

};

// swap method called for script hot-reloading
// inherit your script state here
// MenuBinder.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// http://developer.playcanvas.com/en/user-manual/scripting/