var AirlockBinder = pc.createScript('airlockBinder');

AirlockBinder.attributes.add("externalScript", {
    type: "asset"
});

AirlockBinder.attributes.add("playerModelHandler", {
    type: "entity"
});

AirlockBinder.attributes.add("musicEntity", {
    type: "entity"
});

AirlockBinder.attributes.add("buttonRight", {
    type: "entity"
});

AirlockBinder.attributes.add("buttonLeft", {
    type: "entity"
});

AirlockBinder.attributes.add("buttonJoin", {
    type: "entity"
});

AirlockBinder.attributes.add('baseShareLink', {
    title: 'Base Link',
    description: 'Base link to share.',
    type: 'string',
    //default: 'https://tellyclub.com/join-room'
    default: 'https://etribe.com/'
});

// initialize code called once per entity
AirlockBinder.prototype.initialize = function () {

};

// update code called every frame
AirlockBinder.prototype.update = function (dt) {

};

AirlockBinder.prototype.bindEvents = function (element) {
    let self = this;
    this.containerElement = element;
    this.bindBrandliveScript();

    var room = (window.TellyP2P && TellyP2P.code) ? TellyP2P.code : getURLParameter(ROOM_PARAM);
    this.shareLink = this.baseShareLink + "?" + ROOM_PARAM + "=" + room;
    var env = getURLParameter(ENV_PARAM);
    if (env) this.shareLink += "&" + ENV_PARAM + "=" + env;

    console.log(this.shareLink);

};

// Name field above the join button. Persists to localStorage on every
// keystroke; networking.js reads it when the main scene initializes, so
// whatever is in the field at join time is what peers will see.
AirlockBinder.prototype.showNameField = function () {
    if (typeof getStoredUsername !== 'function') return; // stale constants.js
    if (document.getElementById("tc-name-input")) return;
    var anchor = document.querySelector(".tc-airlock-join-room");
    var parent = (anchor && anchor.parentElement) ? anchor.parentElement : this.containerElement;
    if (!parent) return;

    var input = document.createElement("input");
    input.id = "tc-name-input";
    input.type = "text";
    input.maxLength = USERNAME_MAX_LENGTH;
    input.placeholder = "Your name";
    input.autocomplete = "nickname";
    input.value = getStoredUsername();
    input.style.cssText = "display:block;margin:10px auto 0;padding:8px 14px;width:200px;" +
        "box-sizing:border-box;text-align:center;font-size:14px;color:#fff;" +
        "background:rgba(26,26,31,0.8);border:1px solid #555;border-radius:16px;outline:none;";
    input.addEventListener("input", function () {
        try {
            localStorage.setItem(USERNAME_STORAGE_KEY, sanitizeUsername(input.value));
        } catch (err) { /* storage blocked - session keeps the fallback name */ }
    });
    // keep WASD & co. from steering the avatar preview while typing
    input.addEventListener("keydown", function (e) { e.stopPropagation(); });
    input.addEventListener("keyup", function (e) { e.stopPropagation(); });

    parent.insertBefore(input, anchor ? anchor.nextSibling : null);
};

AirlockBinder.prototype.showRoomCode = function () {
    if (!window.TellyP2P || !TellyP2P.code) return;
    var self = this;
    var anchor = document.querySelector(".tc-airlock-join-room");
    var badge = document.createElement("div");
    badge.id = "tc-room-code";
    badge.innerHTML = "Room <b>" + TellyP2P.code + "</b> &mdash; click to copy invite";
    badge.style.cssText = "cursor:pointer;text-align:center;margin-top:10px;color:#fff;" +
        "font-size:14px;letter-spacing:2px;user-select:none;";
    badge.addEventListener("click", () => {
        navigator.clipboard.writeText(self.shareLink);
        badge.innerHTML = "Room <b>" + TellyP2P.code + "</b> &mdash; invite copied!";
    });
    var parent = (anchor && anchor.parentElement) ? anchor.parentElement : this.containerElement;
    if (parent) parent.appendChild(badge);
};

AirlockBinder.prototype.bindMediaButtons = function () {
    var self = this;
    let manager = this.app.systems.sound.manager;

    var micBtn = document.querySelector("#tc-microphone");
    var volumeBtn = document.querySelector("#tc-volume");
    var cameraBtn = document.querySelector("#tc-video");
    var musicBtn = document.querySelector("#tc-music");

    var deviceBtn = document.getElementById("tc-audio-video-select");

    var btnLeft = document.querySelector("#tc-airlock-left-arrow");
    var btnRight = document.querySelector("#tc-airlock-right-arrow");
    var btnJoin = document.querySelector(".tc-airlock-join-room");
    // var btnBack = document.querySelector(".tc-airlock-back");

    // btnBack.addEventListener("click", ()=>{
    //     window.history.back();
    // });

    btnRight.addEventListener("click", () => {
        self.buttonRight.fire("cycle:right");
    });
    btnLeft.addEventListener("click", () => {
        self.buttonLeft.fire("cycle:left");
    });
    btnJoin.addEventListener("click", () => {
        self.entity.fire("remove");
        self.buttonJoin.fire("button:join");
    });

    var volumeInput = document.querySelector("#tc-volume-tooltip").querySelector("input");

    volumeBtn.addEventListener("click", () => {
        volumeInput.value = manager.volume * 100;
    });

    volumeInput.addEventListener("input", () => {
        manager.volume = volumeInput.value / 100;
    });

    this.app.videoToggle = true;
    cameraBtn.addEventListener("click", () => {
        var bool = cameraBtn.classList.contains("active-icon");
        this.app.fire("video:toggle", bool);//self.playerModelHandler.script.get("modelHandler").toggleVideo(bool);//.fire("video:toggle", bool);

        self.app.videoToggle = bool;
        //this.videoControllerEntity.fire("mute:video", !bool);
    });

    this.app.musicToggle = true;
    musicBtn.addEventListener("click", () => {
        var bool = musicBtn.classList.contains("active-icon");
        self.musicEntity.enabled = bool;

        self.app.musicToggle = bool;
    });

    this.app.micToggle = true;
    micBtn.addEventListener("click", () => {
        //self.updateDeviceList();
        var bool = micBtn.classList.contains("active-icon");
        self.app.micToggle = bool;

    });

    deviceBtn.addEventListener("click", () => {
        self.updateDeviceList();
    });

    this.inputDeviceTemplate = document.querySelector(".input-mic-selection").firstElementChild;
    this.inputDeviceTemplate.querySelector("input").removeAttribute("checked");
    this.inputDeviceTemplate.querySelector("input").setAttribute("name", "mic");

    this.camDeviceTemplate = document.querySelector(".input-cam-selection").firstElementChild;
    this.camDeviceTemplate.querySelector("input").removeAttribute("checked");
    this.camDeviceTemplate.querySelector("input").setAttribute("name", "cam");

    self.updateDeviceList();

    self.showNameField();
    self.showRoomCode();

};

AirlockBinder.prototype.updateDeviceList = function () {
    var self = this;
    navigator.mediaDevices.enumerateDevices().then(function (devices) {
        audioList = document.querySelector(".input-mic-selection");
        videoList = document.querySelector(".input-cam-selection");
        var template = self.inputDeviceTemplate;
        var camTemplate = self.camDeviceTemplate;
        audioList.innerHTML = "";
        videoList.innerHTML = "";
        console.log(devices);
        let firstAudio = true;
        let firstVideo = true;
        devices.forEach(function (device) {
            if (device.kind.includes("audioinput")) {
                //let [kind, type, direction] = device.kind.match(/(\w+)(input)/i);
                let active = firstAudio;
                firstAudio = false;
                let elem = template.cloneNode(true);
                if (active) {
                    elem.querySelector("input").checked = true;
                    self.app.audioInputDevice = device.deviceId;
                }
                console.log(elem);
                elem.querySelector("input").value = device.deviceId;
                elem.querySelector("label").innerHTML = device.label;
                //let elem = htmlToElement('<div class="input-sound"> <input type="radio" id="mbp-m" name="mac" value="'+device.deviceId+'" '+active+'> <label for="mac">'+device.label+'</label></div>');

                elem.addEventListener("click", (event) => {
                    if (self.app.audioInputDevice == event.target.value)
                        return;
                    self.app.audioInputDevice = event.target.value;
                });
                audioList.appendChild(elem);
            } else if (device.kind.includes("videoinput")) {
                let active = firstVideo;
                firstVideo = false;
                let elem = camTemplate.cloneNode(true);
                if (active) {
                    elem.querySelector("input").checked = true;
                    self.app.videoInputDevice = device.deviceId;
                }
                console.log(elem);
                elem.querySelector("input").value = device.deviceId;
                elem.querySelector("label").innerHTML = device.label;
                //let elem = htmlToElement('<div class="input-sound"> <input type="radio" id="mbp-m" name="mac" value="'+device.deviceId+'" '+active+'> <label for="mac">'+device.label+'</label></div>');

                elem.addEventListener("click", (event) => {
                    if (self.app.videoInputDevice == event.target.value)
                        return;
                    self.app.videoInputDevice = event.target.value;
                });
                videoList.appendChild(elem);
            }
        });
    });
};

AirlockBinder.prototype.bindBrandliveScript = function () {
    const script = document.createElement('script');
    script.src = airlockScript;

    document.head.appendChild(script);

    script.addEventListener("load", () => {
        this.bindMediaButtons();
    });
    this.on('destroy', function () {
        script.remove();
    });
};

/**
 * @param {String} HTML representing a single element
 * @return {Element}
 */
function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
}
/**
 * @param {String} HTML representing any number of sibling elements
 * @return {NodeList} 
 */
function htmlToElements(html) {
    var template = document.createElement('template');
    template.innerHTML = html;
    return template.content.childNodes;
}

// swap method called for script hot-reloading
// inherit your script state here
// MenuBinder.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// http://developer.playcanvas.com/en/user-manual/scripting/