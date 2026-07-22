var EmotesButtonHandler = pc.createScript('emotesButtonHandler');

EmotesButtonHandler.attributes.add('player', { type: 'entity', description: 'Player Entity to Play Emotes on', title: 'Player Entity' });
EmotesButtonHandler.attributes.add("waveDuration", {
    title: "Wave Duration",
    description: "Duration the Wave Emote should play",
    type: "number",
    default: 1
});
EmotesButtonHandler.attributes.add("danceDuration", {
    title: "Dance Duration",
    description: "Duration the Dance Emote should play",
    type: "number",
    default: 8
});

// initialize code called once per entity
EmotesButtonHandler.prototype.initialize = function () {
    this.isDancing = false;
    this.emoteTimers = {};
    this.pressedKeys = {};

    this.entity.on("ui:emotes:wave", function (event) {
        console.log("Play Wave");
        this.playEmote(emotes.WAVE, true);
    }, this);

    this.entity.on("ui:emotes:dance", function (event) {
        this.playEmote(emotes.DANCE, true);
    }, this);

    this.app.on("player:walk", () => { this.isDancing = false; delete this.emoteTimers[emotes.DANCE]; }, this);

    this.app.keyboard.on(pc.EVENT_KEYDOWN, this.onKeyDown, this);
    this.app.keyboard.on(pc.EVENT_KEYUP, this.onKeyUp, this);
};

EmotesButtonHandler.prototype.onKeyDown = function (event) {
    if (this.app.exiting === true || this.pressedKeys[event.key])
        return;
    this.pressedKeys[event.key] = true;
    if (event.key == pc.KEY_H) {
        this.playEmote(emotes.WAVE, false);
    } else if (event.key == pc.KEY_Z) {
        this.playEmote(emotes.DANCE, false);
    }
    // for testing exit
    else if (event.key == pc.KEY_L) {
        this.app.fire('player:exit');
    }
};

EmotesButtonHandler.prototype.onKeyUp = function (event) {
    this.pressedKeys[event.key] = false;
    if (event.key == pc.KEY_H) {
        this.stopEmote(emotes.WAVE);
    } else if (event.key == pc.KEY_Z) {
        this.stopEmote(emotes.DANCE);
    }
};

// update code called every frame
EmotesButtonHandler.prototype.update = function (dt) {
    if (this.isEmpty(this.emoteTimers)) return;
    let finishedTimers = [];
    Object.keys(this.emoteTimers).forEach(emote => {
        if (this.emoteTimers[emote] < 0) {
            this.stopEmote(emote);
            finishedTimers.push(emote);
        } else {
            this.emoteTimers[emote] -= dt;
        }
    });
    if (finishedTimers.length > 0) {
        finishedTimers.forEach(emote => { delete this.emoteTimers[emote]; });
    }
};

EmotesButtonHandler.prototype.playEmote = function (emote, isButton) {
    if (this.app.exiting === true) return;
    switch (emote) {
        case emotes.WAVE:
            this.app.fire('player:wavestart');
            if (isButton) this.emoteTimers[emotes.WAVE] = this.waveDuration;
            break;
        case emotes.DANCE:
            if (!this.isDancing) {
                InputHandler.instance.resetDirectControl();
                this.isDancing = true;
                this.app.fire('player:dance');
                if (isButton) this.emoteTimers[emotes.DANCE] = this.danceDuration;
                else delete this.emoteTimers[emotes.DANCE];
            } else {
                this.stopEmote(emotes.DANCE);
            }
            break;
    }
};

EmotesButtonHandler.prototype.stopEmote = function (emote) {
    if (emote == emotes.WAVE) this.app.fire('player:wavestop');
    if (emote == emotes.DANCE) {
        this.isDancing = false;
        if (Object.keys(this.emoteTimers).includes(emotes.DANCE)) delete this.emoteTimers[emotes.DANCE];
        this.app.fire('player:idle');
    }
};

EmotesButtonHandler.prototype.isEmpty = function (obj) {
    for (var i in obj) return false;
    return true;
};
