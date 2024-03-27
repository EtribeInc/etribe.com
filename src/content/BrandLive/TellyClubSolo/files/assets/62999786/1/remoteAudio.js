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

RemoteAudio.attributes.add("fallbackSettings", {
    title: "Fallback Settings",
    type: "json",
    schema: [{
        name: "refDistance",
        type: "number",
        default: 1
    },{
        name: "maxDistance",
        type: "number",
        default: 10
    },{
        name: "baseVolume",
        type: "number",
        default: 100
    }
    ]
});

// initialize code called once per entity
RemoteAudio.prototype.initialize = function() {
    this.simple = this.app.fallBackAudio;
};

// update code called every frame
RemoteAudio.prototype.update = function(dt) {
    if(!this.simple){
        if (!this.context || !this.pannerNode) return;
    
        //console.log(this.pannerNode);
        this.pos = this.remoteAudioEntity.getPosition();
        this.pannerNode.positionX.value = this.pos.x;
        this.pannerNode.positionY.value = this.pos.y;
        this.pannerNode.positionZ.value = this.pos.z;

        this.forward = this.remoteAudioEntity.forward;
        this.pannerNode.orientationX.value = this.forward.x;
        this.pannerNode.orientationZ.value = this.forward.z;
        this.pannerNode.orientationY.value = this.forward.y;
    } else {
        if (!this.audioTrack) return;
        this.pos = this.remoteAudioEntity.getPosition();
        this.calcVolume(this.pos);
    }
};

RemoteAudio.prototype.assignRemoteAudio = function(stream){
    this.context = this.app.systems.sound.context;

    this.pos = this.remoteAudioEntity.getPosition();

    if(!this.simple){
        //console.log(stream.getTracks()[0].applyConstraints({echoCancellation: true}));
        //stream.getTracks()[0].applyConstraints({echoCancellation: true});
        //console.log(stream.getTracks()[0].getConstraints());
        
        // where the sound is oriented to
        this.forward = this.remoteAudioEntity.forward;
        this.orientationX = this.forward.x;
        this.orientationY = this.forward.y;
        this.orientationZ = this.forward.z;


        this.pannerNode = new PannerNode(this.context, {
            panningModel: this.spatialSettings.pannerModel,
            distanceModel: this.spatialSettings.distanceModel,
            positionX: this.pos.x,
            positionY: this.pos.y,
            positionZ: this.pos.z,
            orientationX: this.orientationX,
            orientationY: this.orientationY,
            orientationZ: this.orientationZ,
            refDistance: this.spatialSettings.refDistance,
            maxDistance: this.spatialSettings.maxDistance,
            rolloffFactor: this.spatialSettings.rollOff,
            coneInnerAngle: this.spatialSettings.innerCone,
            coneOuterAngle: this.spatialSettings.outerCone,
            coneOuterGain: this.spatialSettings.outerGain
        });
        //var srcNode = this.context.createMediaElementSource(audio);
        this.srcNode = this.context.createMediaStreamSource(stream);
        this.gainNode = this.context.createGain();
        this.pannerOptions = { pan: 0 };
        this.stereoPanner = new StereoPannerNode(this.context, this.pannerOptions);

        this.srcNode.connect(this.gainNode).connect(this.stereoPanner).connect(this.pannerNode).connect(this.context.destination);

        //audio.play();
    } else {
        this.listener = this.context.listener;
    }
};

RemoteAudio.prototype.assignRemoteAudioTrack = function(audioTrack){
    this.context = this.app.systems.sound.context;

    this.pos = this.remoteAudioEntity.getPosition();
    this.listener = this.context.listener;
    this.audioTrack = audioTrack;
};


RemoteAudio.prototype.calcVolume = function(pos){
    var distance = pos.distance(new pc.Vec3(this.listener.positionX.value, this.listener.positionY.value, this.listener.positionZ.value));
    let volume = 0;
    if(distance > this.fallbackSettings.maxDistance)
        volume = 0;
    else if (distance <= this.fallbackSettings.refDistance)
        volume = this.fallbackSettings.baseVolume;
    else {
        volume = this.fallbackSettings.baseVolume- (distance- this.fallbackSettings.refDistance)/(this.fallbackSettings.maxDistance - this.fallbackSettings.refDistance)*this.fallbackSettings.baseVolume;
    }

    this.audioTrack.setVolume(volume);
};

// swap method called for script hot-reloading
// inherit your script state here
// RemoteAudio.prototype.swap = function(old) { 
//     this.pannerNode = old.pannerNode;

//     this.pannerNode.panningModel= this.spatialSettings.pannerModel;
//     this.pannerNode.distanceModel= this.spatialSettings.distanceModel;
//     this.pannerNode.refDistance= this.spatialSettings.refDistance;
//     this.pannerNode.maxDistance= this.spatialSettings.maxDistance;
//     this.pannerNode.rolloffFactor= this.spatialSettings.rollOff;
//     this.pannerNode.coneInnerAngle= this.spatialSettings.innerCone;
//     this.pannerNode.coneOuterAngle= this.spatialSettings.outerCone;
//     this.pannerNode.coneOuterGain= this.spatialSettings.outerGain;

// };

// to learn more about script anatomy, please read:
// https://developer.playcanvas.com/en/user-manual/scripting/