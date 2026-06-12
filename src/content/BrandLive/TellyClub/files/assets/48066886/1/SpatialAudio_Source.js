var SpatialAudioSource = pc.createScript('spatialAudio_Source');

SpatialAudioSource.attributes.add("audioFile", {
    type: "asset",
    assetType: "audio"
});

SpatialAudioSource.attributes.add('loop', {
    title: 'Loop',
    description: 'If true the audio is looped.',
    type: 'boolean'
});

// initialize code called once per entity
SpatialAudioSource.prototype.initialize = function() {


    // AutoPlay is not supported without userInteraction - play function is called after mousedown
    this.app.mouse.on(pc.EVENT_MOUSEDOWN, this.play, this);

    // find first occurence of object with spatialAutio_Listener script attached in scene (should also be only ONE!)
    let audioListener = this.app.root.children[0].findOne(function (node) {
        return node.script && node.script.spatialAudio_Listener;
    });
    //assign audioListener script to variable
    if(audioListener)
        this.audioListener = audioListener.script.spatialAudio_Listener;
};

// update code called every frame
SpatialAudioSource.prototype.update = function(dt) {
    if(!this.source){
        return;
    }
    var pos = this.entity.getPosition();
    var up = this.entity.up;
    var forward = this.entity.forward;
    
    // update position and orientation of AudioSource on every frame
    this.source.setPosition(pos.x, pos.y, pos.z);
    this.source.setOrientation(forward.x, forward.y, forward.z, up.x, up.y, up.z);
};

SpatialAudioSource.prototype.play = function(){
    
    if(this.audioSource)
        return;
    
    this.audioListener.init();
     // Create an AudioElement.
    this.audioSource = document.createElement('audio');

    // Load an audio file into the AudioElement.
    this.audioSource.src = this.audioFile.getFileUrl();
    
    this.audioSource.crossOrigin = 'anonymous';
    this.audioSource.load();
    this.audioSource.loop = this.loop;

    // add audiSource to audioListener
    if(this.audioListener){
        this.addAudioSource(this.audioSource);
    }
    
    if (!this.audioSource) {
        console.log("No Audio SRC returning");
        return;
    }
    this.audioSource.play();
};

SpatialAudioSource.prototype.addAudioSource = function(audioElement){
    // Generate a MediaElementSource from the AudioElement.
    let audioElementSource = this.audioListener.audioContext.createMediaElementSource(audioElement);

    // Add the MediaElementSource to the scene as an audio input source.
    this.source = this.audioListener.resonanceAudioScene.createSource();
    audioElementSource.connect(this.source.input);
};



// swap method called for script hot-reloading
// inherit your script state here
// SpatialAudioSource.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// https://developer.playcanvas.com/en/user-manual/scripting/

