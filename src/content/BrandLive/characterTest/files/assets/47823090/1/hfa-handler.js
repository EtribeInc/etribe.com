/*jshint esversion: 9 */
var HfaHandler = pc.createScript('hfaHandler');

HfaHandler.attributes.add("connectButton", {
    type: "entity"
});

// initialize code called once per entity
HfaHandler.prototype.initialize = function() {

    this.connectButton.element.on("click", ()=>{
        console.log("Connecting ...");
        this.connectButton.button.active = false;
        connectToHiFiAudio();
    });
};

// update code called every frame
HfaHandler.prototype.update = function(dt) {
    
};

async function connectToHiFiAudio(stream) {

    var audioDiv = document.createElement("div");
    audioDiv.innerHTML = "<audio controls autoplay class='outputAudioEl' style='width: 100%; height: 75px; margin: 30px 0 0 0;'></audio>";
    
    document.body.appendChild(audioDiv);
    // Get the audio media stream associated with the user's default audio input device.
    let audioMediaStream;
    try {
        audioMediaStream = await navigator.mediaDevices.getUserMedia({ audio: HighFidelityAudio.getBestAudioConstraints(), video: false });
    } catch (e) {
        return;
    }

    // Set up the initial data for our user.
    // They'll be standing at the origin, facing "forward".
    let initialHiFiAudioAPIData = new HighFidelityAudio.HiFiAudioAPIData({
        position: new HighFidelityAudio.Point3D({ "x": 0, "y": 0, "z": 0 }),
        orientationEuler: new HighFidelityAudio.OrientationEuler3D({ "pitch": 0, "yaw": 0, "roll": 0 })
    });

    // Set up our `HiFiCommunicator` object, supplying our media stream and initial user data.
    let hifiCommunicator = new HighFidelityAudio.HiFiCommunicator({
        initialHiFiAudioAPIData: initialHiFiAudioAPIData
    });
    await hifiCommunicator.setInputAudioMediaStream(audioMediaStream);

    // Connect to the HiFi Audio API server!
    // Supply your own JWT here.
    const HIFI_AUDIO_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBfaWQiOiJiZGIyOGMwYy02NDQzLTRlNjctOTgzMC0xOWZkNzA4N2UwZDEiLCJ1c2VyX2lkIjoiVGVzdF9Vc2VyIiwic3BhY2VfaWQiOiJlYTM3MGQ2Zi01ZjRjLTQyOTgtODZjOC0zYjAzM2RmODJhNDEiLCJzdGFjayI6ImF1ZGlvbmV0LW1peGVyLWFwaS1ob2JieS0wOCJ9.P_NEE2jiqy5kJdlEtPw0HTSMA1TBWEk6kh02V9G1AOU";
    try {
        await hifiCommunicator.connectToHiFiAudioAPIServer(HIFI_AUDIO_JWT);
    } catch (e) {
        console.error(`Error connecting to High Fidelity:\n${e}`);
        //connectButton.disabled = false;
        connectButton.innerHTML = `Connection error. Retry?`;
        return;
    }

    // Show the user that we're connected by changing the text on the button.
    console.log(`Connected!`);

    // Set the `srcObject` on our `audio` DOM element to the final, mixed audio stream from the High Fidelity Audio API Server.
    document.querySelector(`.outputAudioEl`).srcObject = hifiCommunicator.getOutputAudioMediaStream();
    // We explicitly call `play()` here because certain browsers won't play the newly-set stream automatically.
    document.querySelector(`.outputAudioEl`).play();
}

// swap method called for script hot-reloading
// inherit your script state here
// HFAHandler.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// https://developer.playcanvas.com/en/user-manual/scripting/