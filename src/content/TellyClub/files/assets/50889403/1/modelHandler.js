var ModelHandler = pc.createScript('modelHandler');

ModelHandler.attributes.add('heartsForever', {
    title: 'Hearts Forever',
    description: 'Fire hearts particels once or play as long as waving.',
    type: 'boolean'
});

ModelHandler.attributes.add('screenMaterial', {
    title: 'Screen Material',
    description: 'The screen material of the TV that displays the video texture.',
    type: 'asset',
    assetType: 'material'
});

ModelHandler.attributes.add('placeholderScreenMaterial', {
    title: 'Placeholder Screen Material',
    description: 'The placeholder material that is displayed when the user has no video.',
    type: 'asset',
    assetType: 'material'
});

ModelHandler.attributes.add('playerModels', {
    type: 'asset',
    asssetType: "template",
    name: "Model Templates",
    array: true
});

// initialize code called once per entity
ModelHandler.prototype.initialize = function () {
    this.isPlayer = this.entity.tags.has("Player");
    if (Networking.instance)
        this.networking = Networking.instance.entity.script.get("networking");
};

// update code called every frame
ModelHandler.prototype.update = function (dt) {

};


ModelHandler.prototype.updateAnimation = function (layer, state) {
    if (!this.model) return;
    if (layer == animLayers.BASE) {
        if (this.currentBaseState === state) return;
        this.resetParameters();
        // console.log("Updating Animation State ...");
        switch (state) {
            case baselayerAnimStates.IDLE:
                // console.log("Setting Idle state");
                break;
            case baselayerAnimStates.WALK:
                // console.log("Setting Walk state");
                this.model.anim.setBoolean("Forward", true);
                break;
            case baselayerAnimStates.WALKBACK:
                // console.log("Setting Walkback state");
                this.model.anim.setBoolean("Backward", true);
                break;
            case baselayerAnimStates.TURNLEFT:
                // console.log("Setting TurnLeft state");
                this.model.anim.setBoolean("Left", true);
                break;
            case baselayerAnimStates.TURNRIGHT:
                // console.log("Setting TurnRight state");
                this.model.anim.setBoolean("Right", true);
                break;
            case baselayerAnimStates.DANCE:
                // console.log("Setting Dance state");
                if (this.isPlayer) InputHandler.instance.resetDirectControl();  //TODO: better way to do this?
                this.model.anim.setBoolean("Dance", true);
                break;
            case baselayerAnimStates.EXIT:
                // Disable Controls if this is Player
                //if (this.isPlayer) InputHandler.instance.resetDirectControl();  //TODO: better way to do this?
                this.model.anim.setBoolean("Exit", true);
                break;
        }
        this.currentBaseState = state;
    } else if (layer == animLayers.UPPERBODY) {
        if (this.currentUpperbodyState === state) return;
        switch (state) {
            case upperbodyAnimStates.WAVESTART:
                // console.log("Setting Wave state");
                this.setWaveLayerState(true);
                break;
            case upperbodyAnimStates.WAVESTOP:
                // console.log("Setting Wave state");
                this.setWaveLayerState(false);
                break;
        }
        this.currentUpperbodyState = state;
    }
    // TODO: Update networking to reflect anim layer changes?
    if (this.isPlayer)
        this.networking.SendStateUpdate(layer, state);
};

ModelHandler.prototype.setWaveLayerState = function (enable) {
    var val = enable ? 1.0 : 0.0;
    var upperbodyData = { value: this.upperbodyLayer.weight };
    var baseData = { value: this.model.anim.baseLayer.weight };
    var length = 0.2;

    if (this.upperBodyWaveTween) this.upperBodyWaveTween.stop();
    if (this.baseWaveTween) this.baseWaveTween.stop();

    this.upperBodyWaveTween = this.app.tween(upperbodyData).to({ value: val }, length);
    this.upperBodyWaveTween.on('update', function (dt) {
        this.upperbodyLayer.weight = upperbodyData.value;
    }, this);
    this.upperBodyWaveTween.start();
    // this.baseWaveTween = this.app.tween(baseData).to({ value: 1 - val }, length).on('update', function (dt) {
    //     this.model.anim.baseLayer.weight = baseData.value;
    // }, this).start();

    if (enable) {
        this.soundSrc.play("Wave_Arm_Up");
        setTimeout(() => { this.soundSrc.slot('Wave_Loop').volume = this.waveInitialVolume; }, this.soundSrc.slot("Wave_Arm_Up").duration);
        // if(this.particles){
        //     this.particles.reset();
        //     this.particles.play();
        // }

    } else {
        this.soundSrc.slot('Wave_Loop').volume = 0.0;
        this.soundSrc.play("Wave_Arm_Down");
        if (this.particles)
            this.particles.stop();
    }
};

ModelHandler.prototype.resetParameters = function () {
    this.model.anim.setBoolean("Forward", false);
    this.model.anim.setBoolean("Backward", false);
    this.model.anim.setBoolean("Left", false);
    this.model.anim.setBoolean("Right", false);
    this.model.anim.setBoolean("Dance", false);
    this.model.anim.setBoolean("Exit", false);
};

ModelHandler.prototype.instantiateModel = function (modelIndex, screenMat) {

    if (this.model)
        this.model.destroy();
    if (modelIndex < this.playerModels.length) {
        this.model = this.playerModels[modelIndex].resource.instantiate();
    } else {
        this.model = this.playerModels[0].resource.instantiate();
    }

    this.upperbodyLayer = this.model.anim.findAnimationLayer('UpperBody');
    // this.upperbodyLayer.assignMask({
    //     "RootNode": false,
    //     "RootNode/Bip001": false,
    //     "RootNode/Bip001/Bip001 Footsteps": false,
    //     "RootNode/Bip001/Bip001 Pelvis": false,
    //     "RootNode/Bip001/Bip001 Pelvis/Bip001 Spine": false,
    //     "RootNode/Bip001/Bip001 Pelvis/Bip001 Spine/Bip001 Spine1/Bip001 Neck/Bip001 R Clavicle": {
    //         children: true
    //     },
    // });

    var index = this.model.model.meshInstances.findIndex(meshinstance => meshinstance.material.name === "Screen");
    //var index = this.model.render.meshInstances.findIndex(meshinstance => meshinstance.material.name === "Screen");
    if (screenMat) {
        this.model.model.meshInstances[index].material = screenMat;
    } else if (this.screenMaterial) {
        this.model.model.meshInstances[index].material = this.screenMaterial.resource;
        //this.model.render.meshInstances[index].material = this.screenMaterial.resource;
    }

    this.entity.addChild(this.model);
    this.model.setLocalPosition(0, 0, 0);

    if (this.entity.script.has("convoHandler"))
        this.entity.script.get("convoHandler").modelInit(this.model);

    if (this.entity.findComponent('particlesystem')) {
        this.particles = this.entity.findComponent('particlesystem');
        this.particles.loop = this.heartsForever;
        //console.log(this.entity.name + ', this.particles.loop = ' + this.particles.loop);
    }

    this.soundSrc = this.model.findComponent("sound");
    this.waveInitialVolume = this.soundSrc.slot('Wave_Loop').volume;
    this.soundSrc.slot('Wave_Loop').volume = 0.0;
    this.model.anim.on("idle", () => {
        if (this.currentBaseState != baselayerAnimStates.IDLE)
            return;
        this.stopNonwaveSounds();
    }, this);

    this.model.anim.on("walk", () => {
        if (this.currentBaseState != baselayerAnimStates.WALK && this.currentBaseState != baselayerAnimStates.WALKBACK)
            return;
        this.stopNonwaveSounds();
        this.soundSrc.play("Walk_Loop");
    }, this);

    this.model.anim.on("shuffle", () => {
        if (this.currentBaseState != baselayerAnimStates.TURNLEFT && this.currentBaseState != baselayerAnimStates.TURNRIGHT)
            return;
        this.stopNonwaveSounds();
        this.soundSrc.play("Shuffle");
    }, this);

    this.model.anim.on("wave", () => {
        this.soundSrc.play("Wave_Loop");
    }, this);

    this.model.anim.on("dance", () => {
        if (this.currentBaseState != baselayerAnimStates.DANCE)
            return;
        this.stopNonwaveSounds();
        this.soundSrc.play("Dance");
    }, this);

    this.model.anim.on("Exit", () => {
        if (this.currentBaseState != baselayerAnimStates.EXIT)
            return;
        this.stopNonwaveSounds();
        this.soundSrc.play("Exit");
    }, this);

    this.model.anim.on("hole:start", () => {
        this.model.fire("animation:hole:start");
    });

    this.model.anim.on("hole:end", () => {
        this.model.fire("animation:hole:end");
    });

    return this.model;
};

ModelHandler.prototype.stopNonwaveSounds = function () {
    this.soundSrc.slot('Walk_Loop').stop();
    this.soundSrc.slot('Dance').stop();
    this.soundSrc.slot('Shuffle').stop();
};

ModelHandler.prototype.updateVideoMaterial = function (videoMaterial) {
    if (this.model) {
        var index = this.model.model.meshInstances.findIndex(meshinstance => meshinstance.material.name.toLowerCase().includes("screen"));
        if (index !== -1) {
            this.model.model.meshInstances[index].material = videoMaterial ? videoMaterial : this.placeholderScreenMaterial.resource;
        }
        //if (this.entity.script.has("convoHandler"))
        //this.entity.script.get("convoHandler").modelInit(this.model);
    }
};