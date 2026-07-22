var ConvoHandler = pc.createScript('convoHandler');

ConvoHandler.attributes.add('localVideoMat', {
    title: 'Local Screen Material',
    description: 'The screen material of the TV that displays the local video texture.',
    type: 'asset',
    assetType: 'material'
});

ConvoHandler.attributes.add('localVideoMatAlpha', {
    title: 'Local Screen Material with alpha',
    description: 'The screen material of the TV that displays the local video texture with alpha.',
    type: 'asset',
    assetType: 'material'
});

ConvoHandler.attributes.add('camera', {
    type: 'entity',
    name: "Camera Entity"
});

ConvoHandler.attributes.add('fadeAmount', {
    type: 'number',
    name: "Fade Amount",
    default: 0.03,
    min: 0,
    max: 1
});

ConvoHandler.attributes.add('convoTransitionDurationAttr', {
    type: 'number',
    name: "Conversation Transition Duration",
    default: 2.0
});

ConvoHandler.attributes.add('convoCheckResolution', {
    type: 'number',
    name: "Conversation Check Resolution",
    default: 0.5
});

ConvoHandler.attributes.add('convoDistance', {
    type: 'number',
    name: "Conversation Distance",
    default: 3
});

ConvoHandler.attributes.add('convoAngle', {
    type: 'number',
    name: "Conversation Angle",
    default: 60
});

ConvoHandler.attributes.add('forced', {
    type: 'boolean',
    title: 'Force Convo Mode',
    default: false
});

// initialize code called once per entity
ConvoHandler.prototype.initialize = function () {
    this.convoCheckTimer = this.convoCheckResolution;
    this.hasConvoCondition = false;
    this.fadeGoal = 1.0;
    this.fadeOrigin = 1.0;
    this.currentFade = 1.0;
    this.fadeLerpTime = 0.0;
    this.convoRadians = (this.convoAngle / 2) * pc.math.DEG_TO_RAD;
    this.networking = Networking.instance.entity.script.get("networking");
    ConvoHandler.convoTransitionDuration = this.convoTransitionDurationAttr;

    this.app.on("convo:force", (bool) => {
        this.forced = bool;
    }, this);
};

ConvoHandler.prototype.modelInit = function (model) {
    this.model = model;
    this.modelMaterial = this.model.model.meshInstances[0].material;
    //this.modelMaterial = this.model.render.meshInstances[0].material;
    this.screenMaterial = this.localVideoMat.resource;

    this.modelMaterialAlpha = this.modelMaterial.clone();
    this.modelMaterialAlpha.blendType = pc.BLEND_NORMAL;
    this.modelMaterialAlpha.update();

    this.screenMaterialAlpha = this.localVideoMatAlpha.resource;
    //this.screenMaterialAlpha.blendType = pc.BLEND_NORMAL;
    //this.screenMaterialAlpha.update();

    this.modelInitialized = true;
    // if (!this.modelInitialized) {
    //     this.model.model.meshInstances[0].material = this.modelMaterialAlpha;
    //     this.model.model.meshInstances[1].material = this.screenMaterialAlpha;
    //     this.setOpacity(this.modelMaterialAlpha, this.currentFade);
    //     this.setOpacity(this.screenMaterialAlpha, this.currentFade);
    //     this.modelInitialized = true;
    // }
};

ConvoHandler.prototype.update = function (dt) {

    if (!this.modelInitialized) return;

    // Check and set conversation conditions
    this.convoCheckTimer -= dt;
    if (this.convoCheckTimer < 0) {
        let convoCondition = this.getConvoCondition(dt);
        if (convoCondition != this.hasConvoCondition) {
            this.hasConvoCondition = convoCondition;
            this.app.fire("convoCondition", convoCondition);
            this.fadeLerpTime = 0.0;
            if (convoCondition)
                this.fadeOut();
            else
                this.fadeIn();
        }
        this.convoCheckTimer = this.convoCheckResolution;
    }

    // Do model fading
    if (this.model && this.currentFade != this.fadeGoal) {
        this.fadeLerpTime += dt;
        let lerpFactor = pc.math.clamp(this.fadeLerpTime / this.convoTransitionDurationAttr, 0, 1);
        //for (var i = 0; i < this.model.model.meshInstances.length; i++) {
        this.setOpacity(this.modelMaterialAlpha, lerpFactor);
        this.setOpacity(this.screenMaterialAlpha, lerpFactor);

        if (this.currentFade == 1.0) {
            this.model.model.meshInstances[0].material = this.modelMaterial;
            this.model.model.meshInstances[1].material = this.screenMaterial;
        }
    }
};

ConvoHandler.prototype.fadeIn = function () {
    this.fadeGoal = 1.0;
    this.fadeOrigin = 0.0;
};

ConvoHandler.prototype.fadeOut = function () {
    this.model.model.meshInstances[0].material = this.modelMaterialAlpha;
    this.model.model.meshInstances[1].material = this.screenMaterialAlpha;
    this.fadeGoal = this.fadeAmount;
    this.fadeOrigin = 1.0;
};

ConvoHandler.prototype.setOpacity = function (material, lerpFactor) {
    var newOpacity = pc.math.lerp(this.fadeOrigin, this.fadeGoal, lerpFactor);
    material.opacity = newOpacity;
    this.currentFade = newOpacity;
    material.update();
};

ConvoHandler.prototype.getConvoCondition = function (dt) {
    if (this.forced)
        return true;

    var result = false;

    // populate an array of telly, if any, within range base on proximity attribute
    this.doProximityCheck();

    // populate an array of proximate telly that are are also within forward facing angle attribute
    var tellyWithinAngle = [];
    if (this.tellyInRange && this.tellyInRange.length > 0) {
        for (var i = 0; i < this.tellyInRange.length; i++) {
            var toTellyInRange = this.tellyInRange[i].getPosition().sub(this.entity.getPosition()).normalize();
            if (this.isInAngle(this.entity.forward, toTellyInRange, this.convoRadians)) {
                tellyWithinAngle.push(this.tellyInRange[i]);
            }
        }
        // check if any telly within forward facing angle are also facing towards the player
        if (tellyWithinAngle && tellyWithinAngle.length > 0) {
            for (var j = 0; j < tellyWithinAngle.length; j++) {
                var toPlayer = this.entity.getPosition().sub(tellyWithinAngle[j].getPosition()).normalize();
                if (this.isInAngle(tellyWithinAngle[j].forward, toPlayer, this.convoRadians)) {
                    result = true;
                    break;
                }
            }
        }
    }
    return result;
};

ConvoHandler.prototype.doProximityCheck = function () {
    this.tellyInRange = [];
    this.players = this.networking.getPlayers();
    if (this.players && Object.keys(this.players).length > 0) {
        for (var id in this.players) {
            if (id != Networking.id) {
                var distance = this.players[id].entity.getPosition().distance(this.entity.getPosition());
                if (distance < this.convoDistance)
                    this.tellyInRange.push(this.players[id].entity);
            }
        }
    }
};

ConvoHandler.prototype.isInAngle = function (v1, v2, angle) {
    // get angle between (v1) and (v2)
    var dotProduct = v1.dot(v2);
    var angleInRadians = Math.acos(dotProduct);

    return (Math.abs(angleInRadians) < angle) ? true : false;
};