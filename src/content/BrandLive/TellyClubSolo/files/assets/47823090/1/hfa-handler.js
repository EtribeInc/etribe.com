/*jshint esversion: 9 */
var HfaHandler = pc.createScript('hfaHandler');

HfaHandler.attributes.add('player', {
    type: 'entity',
    name: "Player Entity"
});

// initialize code called once per entity
HfaHandler.prototype.initialize = function() {

};

HfaHandler.prototype.connectToHiFiAudio = async function(hfa_jwt) {
    console.log("Connecting ...");

    var audioDiv = document.createElement("div");
    audioDiv.innerHTML = "<audio controls autoplay class='outputAudioEl' style='width: 1px; height: 1px; margin: 30px 0 0 0;'></audio>";
    
    document.body.appendChild(audioDiv);

    let audioConstraints = HighFidelityAudio.getBestAudioConstraints();
    
    audioConstraints.echoCancellation = true;

    audioConstraints.noiseSuppression = true;
    
    audioConstraints.autoGainControl = true;
    
    // Get the audio media stream associated with the user's default audio input device.
    let audioMediaStream;
    try {
        audioMediaStream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints, video: false });
        console.log(audioMediaStream);
    } catch (e) {
        return;
    }

    
    let self = this;
    
    this.audioPos = new HighFidelityAudio.Point3D({ "x": 0, "y": 0, "z": 0 });
    this.audioRot = new HighFidelityAudio.Quaternion({ "w": 0, "x": 0, "y": 0, "z": 0 });

    // Set up the initial data for our user.
    // They'll be standing at the origin, facing "forward".
    let initialHiFiAudioAPIData = new HighFidelityAudio.HiFiAudioAPIData({
        position: self.audioPos,
        orientationEuler: self.audioRot
    });

    // Set up our `HiFiCommunicator` object, supplying our media stream and initial user data.
    this.hifiCommunicator = new HighFidelityAudio.HiFiCommunicator({
        initialHiFiAudioAPIData: initialHiFiAudioAPIData
    });
    await this.hifiCommunicator.setInputAudioMediaStream(audioMediaStream);

    // Connect to the HiFi Audio API server!
    // Supply your own JWT here.
    const HIFI_AUDIO_JWT = hfa_jwt;
    try {
        await this.hifiCommunicator.connectToHiFiAudioAPIServer(HIFI_AUDIO_JWT);
    } catch (e) {
        console.error(`Error connecting to High Fidelity:\n${e.message}`);
        //connectButton.disabled = false;
        //connectButton.innerHTML = `Connection error. Retry?`;
        return;
    }

    // Show the user that we're connected by changing the text on the button.
    console.log(`Connected!`);

    // Set the `srcObject` on our `audio` DOM element to the final, mixed audio stream from the High Fidelity Audio API Server.
    document.querySelector(`.outputAudioEl`).srcObject = this.hifiCommunicator.getOutputAudioMediaStream();
    // We explicitly call `play()` here because certain browsers won't play the newly-set stream automatically.
    document.querySelector(`.outputAudioEl`).play();
        
    var audioSwitch = document.querySelector('#audioSwitch');
    
    if(audioSwitch){
        
        console.log(audioSwitch.checked);
        this.mute(!audioSwitch.checked);

        audioSwitch.addEventListener('click', ()=>{self.mute(!audioSwitch.checked);}, false);
    }

};

HfaHandler.prototype.mute = function(bool) {
    this.hifiCommunicator.setInputAudioMuted(bool);
};


// Send the converted position and orientation to the mixer
HfaHandler.prototype.sendUpdatedData = function() {
    if (this.hifiCommunicator) {
        let pos = this.player.getPosition();
        let rot = this.player.getRotation();
    
        this.audioPos.x = pos.x;
        this.audioPos.y = pos.y;
        this.audioPos.z = pos.z;
        
        this.audioRot.w = rot.w;
        this.audioRot.x = rot.x;
        this.audioRot.y = rot.y;
        this.audioRot.z = rot.z;

        let response = this.hifiCommunicator.updateUserDataAndTransmit({
            position: this.audioPos,
            orientation: this.audioRot
        });
    }
};

HfaHandler.prototype.update = function(dt) {
    this.sendUpdatedData();
};

// swap method called for script hot-reloading
// inherit your script state here
// HFAHandler.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// https://developer.playcanvas.com/en/user-manual/scripting/