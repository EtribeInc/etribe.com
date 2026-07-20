var RemoteAudio = pc.createScript('remoteAudio');

RemoteAudio.attributes.add('remoteAudioEntity', {
    type: 'entity',
    name: "Remote Audio Position Entity"
});

RemoteAudio.attributes.add("spatialSettings", {
    title: "Spatial Settings",
    type: "json",
    schema: [{
        name: "pannerModel",
        description: "The panningModel property of the PannerNode interface is an enumerated value determining which spatialisation algorithm to use to position the audio in 3D space. The possible values are: \nequalpower: Represents the equal-power panning algorithm, generally regarded as simple and efficient. equalpower is the default value. \nHRTF: Renders a stereo output of higher quality than equalpower — it uses a convolution with measured impulse responses from human subjects.",
        type: "string",
        default: "equalpower",
        enum: [
            {"equalpower":"equalpower"},
            {"HRTF":"HRTF"}
        ]
    },{
        name: "innerCone",
        type: "number",
        default: 40
    },{
        name: "outerCone",
        type: "number",
        default: 60
    },{
        name: "outerGain",
        type: "number",
        default: 0.4
    },{
        name: "distanceModel",
        type: "string",
        default: "inverse",
        enum: [
            {"linear":"linear"},
            {"inverse":"inverse"},
            {"exponential":"exponential"}
        ]
    },{
        name: "maxDistance",
        type: "number",
        default: 20
    },{
        name: "refDistance",
        type: "number",
        default: 1
    },{
        name: "rollOff",
        type: "number",
        default: 1
    }]
});

// initialize code called once per entity
RemoteAudio.prototype.initialize = function() {
    this.on('destroy', this.clearRemoteAudio, this);
};

// update code called every frame
RemoteAudio.prototype.update = function(dt) {
    if (!this.context || !this.pannerNode) return;

    this.pos = this.remoteAudioEntity.getPosition();
    this.pannerNode.positionX.value = this.pos.x;
    this.pannerNode.positionY.value = this.pos.y;
    this.pannerNode.positionZ.value = this.pos.z;

    this.forward = this.remoteAudioEntity.forward;
    this.pannerNode.orientationX.value = this.forward.x;
    this.pannerNode.orientationZ.value = this.forward.z;
    this.pannerNode.orientationY.value = this.forward.y;
};

RemoteAudio.prototype.assignRemoteAudio = function(stream){
    this.clearRemoteAudio();

    this.context = this.app.systems.sound.context;
    this.pos = this.remoteAudioEntity.getPosition();

    // Chromium workaround: a remote WebRTC MediaStream stays silent inside an
    // AudioContext graph unless it is also attached to a media element. The
    // element is muted so audio is only audible through the panner graph.
    this.shadowAudio = new Audio();
    this.shadowAudio.muted = true;
    this.shadowAudio.srcObject = stream;
    this.shadowAudio.play().catch(() => {
        // autoplay-blocked is fine: element attachment alone satisfies the
        // workaround; playback resumes with the context on the next gesture
    });

    if (this.context.state === 'suspended') {
        var context = this.context;
        var resume = function () {
            context.resume();
            window.removeEventListener('pointerdown', resume);
        };
        window.addEventListener('pointerdown', resume);
    }

    // where the sound is oriented to
    this.forward = this.remoteAudioEntity.forward;

    this.pannerNode = new PannerNode(this.context, {
        panningModel: this.spatialSettings.pannerModel,
        distanceModel: this.spatialSettings.distanceModel,
        positionX: this.pos.x,
        positionY: this.pos.y,
        positionZ: this.pos.z,
        orientationX: this.forward.x,
        orientationY: this.forward.y,
        orientationZ: this.forward.z,
        refDistance: this.spatialSettings.refDistance,
        maxDistance: this.spatialSettings.maxDistance,
        rolloffFactor: this.spatialSettings.rollOff,
        coneInnerAngle: this.spatialSettings.innerCone,
        coneOuterAngle: this.spatialSettings.outerCone,
        coneOuterGain: this.spatialSettings.outerGain
    });
    this.srcNode = this.context.createMediaStreamSource(stream);
    this.gainNode = this.context.createGain();
    this.stereoPanner = new StereoPannerNode(this.context, { pan: 0 });

    this.srcNode.connect(this.gainNode).connect(this.stereoPanner).connect(this.pannerNode).connect(this.context.destination);
};

RemoteAudio.prototype.clearRemoteAudio = function(){
    var nodes = [this.srcNode, this.gainNode, this.stereoPanner, this.pannerNode];
    for (var i = 0; i < nodes.length; i++) {
        if (nodes[i]) {
            try { nodes[i].disconnect(); } catch (e) { /* already disconnected */ }
        }
    }
    this.srcNode = null;
    this.gainNode = null;
    this.stereoPanner = null;
    this.pannerNode = null;

    if (this.shadowAudio) {
        this.shadowAudio.srcObject = null;
        this.shadowAudio = null;
    }
};

// swap method called for script hot-reloading
// inherit your script state here
// RemoteAudio.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// https://developer.playcanvas.com/en/user-manual/scripting/
