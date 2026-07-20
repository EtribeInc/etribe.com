var BrowserDetect = pc.createScript('browserDetect');

// initialize code called once per entity
BrowserDetect.prototype.initialize = async function() {
    // The Blink audio fallback is obsolete: remoteAudio.js attaches remote
    // streams to a muted shadow <audio> element, which makes the Web Audio
    // spatial path work in Chromium too.
    this.app.fallBackAudio = false;
};

// update code called every frame
BrowserDetect.prototype.update = function(dt) {

};

// swap method called for script hot-reloading
// inherit your script state here
// BrowserDetect.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// https://developer.playcanvas.com/en/user-manual/scripting/