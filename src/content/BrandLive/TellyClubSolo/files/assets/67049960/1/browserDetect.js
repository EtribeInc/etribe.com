var BrowserDetect = pc.createScript('browserDetect');

// initialize code called once per entity
BrowserDetect.prototype.initialize = async function() {

    //const Bowser = await import("https://cdnjs.cloudflare.com/ajax/libs/bowser/2.11.0/es5.js");
    
    const browser = bowser.getParser(window.navigator.userAgent);

    this.app.fallBackAudio = browser.getEngineName() == "Blink";
    console.log("Use fallback audio?: "+this.app.fallBackAudio);
};

// update code called every frame
BrowserDetect.prototype.update = function(dt) {

};

// swap method called for script hot-reloading
// inherit your script state here
// BrowserDetect.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// https://developer.playcanvas.com/en/user-manual/scripting/