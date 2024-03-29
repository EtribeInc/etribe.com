var UIOverlayBinder = pc.createScript('uiOverlayBinder');

UIOverlayBinder.attributes.add("networkingEntity", {
    type: "entity"
});

UIOverlayBinder.attributes.add("localVideoEntity", {
    type: "entity"
});

UIOverlayBinder.attributes.add("videoControllerEntity", {
    type: "entity"
});

UIOverlayBinder.attributes.add("playerModelHandler", {
    type: "entity"
});

UIOverlayBinder.attributes.add("musicEntity", {
    type: "entity"
});

UIOverlayBinder.attributes.add('baseShareLink', {
    title: 'Base Link',
    description: 'Base link to share.',
    type: 'string',
    //default: 'https://tellyclub.com/join-room'
    default: 'https://etribe.com/'
});

// UIOverlayBinder.attributes.add('userImage', {
//     title: "User Placeholder Image",
//     type: "asset",
//     assetType: "texture"
// });

// initialize code called once per entity
UIOverlayBinder.prototype.initialize = function () {
    this.networkingEntity.on("playersChanged", (users, admin) => {
        this.populateUsers(users, admin);
    }, this);
};

// update code called every frame
UIOverlayBinder.prototype.update = function (dt) {

};

UIOverlayBinder.prototype.bindEvents = function (element) {
    let self = this;
    this.bindBrandliveScript();

    this.shareLink = this.baseShareLink + "?server=" + getURLParameter("server") + "&port=" + getURLParameter("port");

    console.log(this.shareLink);

    var shareBtnA = document.getElementsByClassName("tc-share-link-modal-btn")[0];
    var shareBtnB = document.getElementsByClassName("tc-attendees-btn")[0];
    var shareBtnC = document.getElementById("tc-tutorial-modal__buttons--share-link");

    shareBtnA.addEventListener("click", () => self.copyShareLink());
    shareBtnB.addEventListener("click", () => self.copyShareLink());
    shareBtnC.addEventListener("click", () => self.copyShareLink());


    this.bindEmoteButtons();

    this.bindMediaButtons();

    document.querySelector(".tc-leave-button").addEventListener("click", () => {

        this.app.fire("player:exit");
        this.app.exiting = true;
        setTimeout(() => {
            //let url = "https://www.tellyclub.com/left-room?server=" + getURLParameter("server") + "&port=" + getURLParameter("port");
            let url = 'https://etribe.com/';
            window.location.replace(url);
        }, 4000);

    });

    var canvas = document.getElementById("tc-overlay-video");
    console.log(canvas);
    this.localVideoEntity.script.get("localVideo").useCustomCanvas(canvas);
};

UIOverlayBinder.prototype.bindEmoteButtons = function () {
    var self = this;
    var waveBtn = document.querySelector("#tc-waving");
    var danceBtn = document.querySelector("#tc-dancing");

    waveBtn.addEventListener("click", () => self.entity.fire("ui:emotes:wave"));
    danceBtn.addEventListener("click", () => self.entity.fire("ui:emotes:dance"));
};

UIOverlayBinder.prototype.bindMediaButtons = function () {
    console.log("binding buttons");
    var self = this;
    let manager = this.app.systems.sound.manager;

    var micBtn = document.getElementById("tc-microphone");
    var volumeBtn = document.getElementById("tc-volume");
    var cameraBtn = document.getElementById("tc-video");
    var musicBtn = document.getElementById("tc-music");

    var gearBtn = document.getElementById("tc-audio-video-select");

    gearBtn.addEventListener("click", () => {
        self.updateDeviceList();
    });

    var volumeInput = document.querySelector("#tc-volume-tooltip").querySelector("input");

    volumeBtn.addEventListener("click", () => {
        volumeInput.value = manager.volume * 100;
    });

    volumeInput.addEventListener("input", () => {
        manager.volume = volumeInput.value / 100;
    });

    if (!this.app.videoToggle) {
        cameraBtn.classList.remove("active-icon");
        this.app.fire("video:toggle", false);//self.playerModelHandler.script.get("modelHandler").toggleVideo(false);//.fire("video:toggle", bool);
    } else {
        this.app.fire("video:toggle", true);//self.playerModelHandler.script.get("modelHandler").toggleVideo(true);//.fire("video:toggle", bool);
    }

    cameraBtn.addEventListener("click", () => {
        var bool = !cameraBtn.classList.contains("active-icon");
        self.videoControllerEntity.fire("mute:video", !bool);
        this.app.fire("video:toggle", bool);//self.playerModelHandler.script.get("modelHandler").toggleVideo(bool);//.fire("video:toggle", bool);
        self.app.videoToggle = bool;
    });

    if (!this.app.musicToggle) {
        musicBtn.classList.remove("active-icon");
        self.musicEntity.enabled = false;
    }
    musicBtn.addEventListener("click", () => {
        self.musicEntity.enabled = !self.musicEntity.enabled;
    });

    micBtn.addEventListener("click", () => {
        var bool = !micBtn.classList.contains("active-icon");
        self.videoControllerEntity.fire("mute:voice", !bool);
    });

    if (!this.app.micToggle) {
        micBtn.classList.remove("active-icon");
    }

    this.userTemplate = document.getElementsByClassName("tc-attendees-tc-attendees-users")[0].firstElementChild;
    this.userTemplate.querySelector(".tc-attendees-gray").innerHTML = "";
    console.log(this.userTemplate);
    this.inputDeviceTemplate = document.querySelector(".input-mic-selection").firstElementChild;
    this.inputDeviceTemplate.querySelector("input").removeAttribute("checked");
    this.inputDeviceTemplate.querySelector("input").setAttribute("name", "mic");


    this.camDeviceTemplate = document.querySelector(".input-cam-selection").firstElementChild;
    this.camDeviceTemplate.querySelector("input").removeAttribute("checked");
    this.camDeviceTemplate.querySelector("input").setAttribute("name", "cam");

};

UIOverlayBinder.prototype.updateDeviceList = function () {
    var self = this;
    navigator.mediaDevices.enumerateDevices().then(function (devices) {
        audioList = document.querySelector(".input-mic-selection");
        videoList = document.querySelector(".input-cam-selection");
        var template = self.inputDeviceTemplate;
        var camTemplate = self.camDeviceTemplate;
        audioList.innerHTML = "";
        videoList.innerHTML = "";
        console.log(devices);
        devices.forEach(function (device) {
            if (device.kind.includes("audioinput")) {
                //let [kind, type, direction] = device.kind.match(/(\w+)(input)/i);
                let active = self.app.audioInputDevice == device.deviceId;
                let elem = template.cloneNode(true);
                if (active) {
                    elem.querySelector("input").checked = true;
                }
                console.log(elem);
                elem.querySelector("input").value = device.deviceId;
                elem.querySelector("label").innerHTML = device.label;
                //let elem = htmlToElement('<div class="input-sound"> <input type="radio" id="mbp-m" name="mac" value="'+device.deviceId+'" '+active+'> <label for="mac">'+device.label+'</label></div>');

                elem.addEventListener("click", (event) => {
                    if (self.app.audioInputDevice == event.target.value)
                        return;
                    self.app.audioInputDevice = event.target.value;
                    self.videoControllerEntity.fire("audio:input", event.target.value);
                });
                audioList.appendChild(elem);
            } else if (device.kind.includes("videoinput")) {
                let active = self.app.videoInputDevice == device.deviceId;
                let elem = camTemplate.cloneNode(true);
                if (active) {
                    elem.querySelector("input").checked = true;
                }
                elem.querySelector("input").value = device.deviceId;
                elem.querySelector("label").innerHTML = device.label;
                //let elem = htmlToElement('<div class="input-sound"> <input type="radio" id="mbp-m" name="mac" value="'+device.deviceId+'" '+active+'> <label for="mac">'+device.label+'</label></div>');

                elem.addEventListener("click", (event) => {
                    if (self.app.videoInputDevice == event.target.value)
                        return;
                    self.app.videoInputDevice = event.target.value;
                    self.videoControllerEntity.fire("video:input", event.target.value);
                });
                videoList.appendChild(elem);
            }
        });
    });
};

UIOverlayBinder.prototype.bindBrandliveScript = function () {

    const script = document.createElement('script');
    script.src = appScript;

    document.head.appendChild(script);

    // script.addEventListener("load", ()=>{
    //     this.bindMediaButtons();
    // });
    this.on('destroy', function () {
        script.remove();
    });

    this.entity.fire("ui:set-up");
};

UIOverlayBinder.prototype.populateUsers = function (users, admin) {
    var self = this;
    let list = document.getElementsByClassName("tc-attendees-tc-attendees-users")[0];
    let template = self.userTemplate;
    console.log(template);
    list.innerHTML = "";
    var userArray = Object.entries(users);
    let countElem = document.getElementById("tc-a-i-number");
    let counter = document.getElementById("tc-attendees-count");
    countElem.innerHTML = counter.innerHTML = userArray.length;

    //let img = this.userImage.getFileUrl();
    //let kickUser = '';
    for (const [key, value] of userArray) {
        console.log(value);
        // if(admin && !value.self)
        //     kickUser = '<div class="remove-user" id="remove-user">X</div>';
        //let userEntry = htmlToElement('<div class="tc-attendees-user"> <img src="'+img+'" alt="tc-attendees-user" /><p class="user-name">'+value.username+'</p><p class="tc-attendees-gray"></p>'+kickUser+'</div>');
        let userEntry = template.cloneNode(true);

        //userEntry.querySelector("img").src = img;

        userEntry.querySelector("p").innerHTML = value.username;

        if (value.self) {
            userEntry.querySelector(".tc-attendees-gray").innerHTML = "You";
            //userEntry.querySelector("#remove-user").remove();
        } else if (admin) {
            userEntry.querySelector("#remove-user").addEventListener("click", () => {
                console.log("Trying to kick user ...");
                self.networkingEntity.fire("admin:kick", value.id);
            });
        } else {
            //userEntry.querySelector("#remove-user").remove();
        }

        list.appendChild(userEntry);
    }

};

UIOverlayBinder.prototype.copyShareLink = function () {
    navigator.clipboard.writeText(this.shareLink).then(function () {
        console.log('Async: Copying Link to clipboard was successful!');
    }, function (err) {
        console.error('Async: Could not copy text: ', err);
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