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
    this.bindBrandliveScript();

    this.shareLink = this.baseShareLink + "?server=" + getURLParameter("server") + "&port=" + getURLParameter("port");

    console.log(this.shareLink);

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