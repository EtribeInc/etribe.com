var Networking = pc.createScript('networking');

Networking.attributes.add('player', {
    type: 'entity',
    name: "Player Entity"
});

Networking.attributes.add('playerSpawnerEntity', {
    type: 'entity',
    name: "PlayerSpawner Entity"
});

Networking.socket = null;
Networking.id = null;

Networking.networkedObjects = {};

// initialize code called once per entity
Networking.prototype.initialize = function () {
    var self = this;
    Networking.instance = this;

    this.playerSpawner = this.playerSpawnerEntity.script.get("playerSpawner");
    var address = getURLParameter("server") ? getURLParameter("server") : stagingServer;
    //var address = getURLParameter("ip")?getURLParameter("ip"):'https://127.0.0.1';

    var adminToken = getURLParameter("admin");
    var token = getURLParameter("token") ? getURLParameter("token") : 'gwrO1tp!@trY';

    removeURLParameter("admin");

    address = address.startsWith("http") ? address : "https://" + address;

    var port = getURLParameter("port") ? ":" + getURLParameter("port") : ":" + stagingPort;
    var path = getURLParameter("path") ? getURLParameter("path") : '/socket.io/';

    var socket = io.connect(address + port, {
        path: path
    });

    Networking.socket = socket;
    this.socket = socket;

    var characterID = getURLParameter("char") ? getURLParameter("char") : 0;

    socket.emit('join', { username: "user", model: characterID, token, adminToken }, (error, userData) => {
        if (error) {
            alert(error);
            let url = "https://www.tellyclub.com/join-room" + "?server=" + getURLParameter("server") + "&port=" + getURLParameter("port");
            window.location.replace(url);
        } else {
            this.initializeData(userData);

        }

    });

    socket.on("disconnect", () => {
        alert("You have been kicked!");
        let url = "https://www.tellyclub.com/";
        window.location.replace(url);
    });

    socket.on('playerJoined', function (data) {
        self.addPlayer(data);
    });

    // socket.on ('hfaJWT', function(jwt){
    //     console.log("Connection to HFA with server generated jwt.");
    //     self.entity.script.hfaHandler.connectToHiFiAudio(jwt);
    // });

    socket.on('playerMoved', function (data) {
        self.movePlayer(data);
    });

    socket.on('stateChanged', function (data) {
        self.changeState(data);
    });

    socket.on('removePlayer', function (id) {
        self.removePlayer(id);
    });

    socket.on('error', function (err) {
        console.log("Socket.IO Error");
        console.log(err.stack); // this is changed from your code in last comment
    });

    socket.on("updatedMeetingIndex", ({ meetId, index, count }) => {
        console.log("updating index of meeting");
        this.app.fire("meeting:indexChange", meetId, index, count);
    });

    socket.on("takeOverScreenShare", ({ shareId, uid }, callback) => {
        var panel = document.getElementById("tc-screen-sharing");
        panel.replaceWith(panel = panel.cloneNode(true));
        panel.classList.remove('tc-visible');
        //console.log(panel);
        panel.getElementsByClassName("tc-screen-sharing-title").item(1).innerHTML = (this.players[uid] ? this.players[uid].username : "Unknown user") + " would like to replace your shared screen. Is this ok?";
        panel.querySelector(".tc-screen-sharing-title").innerHTML = "Stop Sharing?";

        var yes = (e) => {
            e.stopPropagation();
            VideoInterface.instance.fire("screen:stopShare");
            callback(true);
            panel.classList.add('tc-visible');
        };
        var no = (e) => {
            e.stopPropagation();
            panel.classList.add('tc-visible');
            callback(false);
        };

        panel.querySelector("#tc-screen-sharing-btn-left").addEventListener("click", no);

        panel.querySelector("#tc-screen-sharing-btn-right").addEventListener("click", yes);
    });

    this.app.on("networking:joinMeeting", this.joinMeeting);
    this.app.on("networking:leaveMeeting", this.leaveMeeting);

    this.on("destroy", () => {
        this.app.off("networking:joinMeeting", this.joinMeeting);
        this.app.off("networking:leaveMeeting", this.leaveMeeting);

    });

    this.entity.on("admin:kick", (id) => {
        console.log("Trying to kick player.");
        if (this.players[id]) {
            Networking.socket.emit("admin:kick", { id }, (error) => {
                if (error) {
                    alert(error);
                } else {
                    alert("User with id " + id + " kicked successfully.");
                }
            });
        }
    });

    // Networked Objects logic

    socket.on("objectMoved", this.onObjectUpdate, this);
};

Networking.prototype.initializeData = function (data) {
    console.log(data);
    this.admin = data.admin;
    // initialize other players
    this.players = data.players;
    Networking.id = data.id;
    for (var id in this.players) {
        if (id != Networking.id) {
            var entity = this.createPlayerEntity(this.players[id], false);
            this.players[id].entity = entity;
        } else {
            this.players[id].self = true;
        }
    }
    this.initialized = true;

    // initialize video service
    this.entity.script.videoController.connectToVideoService(data.video.appid, data.id, data.video.channel, data.video.token);
    console.log('initialized');

    this.entity.fire("playersChanged", this.players, this.admin);
};

Networking.prototype.requestScreenShare = async function (shareId, callback) {
    var self = this;
    Networking.socket.emit("requestScreenShare", { uid: Networking.id, shareId }, callback);
};

Networking.prototype.SendStateUpdate = function (layer, state) {
    Networking.socket.emit("stateUpdate", { id: Networking.id, layer: layer, state: state });
};

Networking.prototype.getNewVideoToken = function () {
    var self = this;
    Networking.socket.emit('generateVideoToken', null, (token) => {
        self.entity.script.videoController.renewToken(token);
    });
};

Networking.prototype.getNewShareToken = function (shareId) {
    var self = this;
    Networking.socket.emit('generateVideoToken', shareId, (token) => {
        self.entity.script.videoController.renewShareToken(token);
    });
};

Networking.prototype.addPlayer = function (data) {
    this.players[data.id] = data;
    var entity = this.createPlayerEntity(data, true);

    this.players[data.id].entity = entity;
    this.entity.fire("playersChanged", this.players, this.admin);
    this.entity.fire("networking:playerJoined");
};

Networking.prototype.movePlayer = function (data) {
    if (this.initialized && this.players[data.id]) {

        var entity = this.players[data.id].entity;
        entity.setPosition(new pc.Vec3(data.pos));
        entity.setEulerAngles(new pc.Vec3(data.rot));
    }
};

Networking.prototype.changeState = function (data) {
    if (this.initialized && this.players[data.id]) {
        var entity = this.players[data.id].entity;
        //Change anim state here
        console.log("State update from " + data.id);

        entity.script.get('modelHandler').updateAnimation(data.layer, data.state);
    }
};

Networking.prototype.removePlayer = function (id) {
    if (this.players[id]) {
        this.players[id].entity.script.modelHandler.updateAnimation(animLayers.BASE, baselayerAnimStates.EXIT);
        setTimeout(() => {
            this.players[id].entity.destroy();
            delete this.players[id];
            this.entity.fire("playersChanged", this.players, this.admin);
        }, 4000);
    } else
        this.entity.fire("playersChanged", this.players, this.admin);

};

Networking.prototype.createPlayerEntity = function (data, isAdd) {
    var newPlayer = this.playerSpawner.spawn(data.model, isAdd);

    if (data) {
        newPlayer.setPosition(new pc.Vec3(data.pos));
        newPlayer.setEulerAngles(new pc.Vec3(data.rot));
        newPlayer.script.get('modelHandler').updateAnimation(data.state);
        let playerTag = newPlayer.findByTag("PlayerTag");
        if (playerTag != undefined) {
            playerTag[0].script.text.setText(data.username);
        }
    }

    return newPlayer;
};

// update code called every frame
Networking.prototype.update = function (dt) {
    this.updatePosition();
};

Networking.prototype.updatePosition = function () {
    if (this.initialized) {
        var pos = this.player.getPosition();
        var position = [pos.x, pos.y, pos.z];
        var rot = this.player.getEulerAngles();
        var rotation = [rot.x, rot.y, rot.z];
        Networking.socket.emit('positionUpdate', { id: Networking.id, pos: position, rot: rotation });
    }
};

Networking.prototype.assignVideoMaterial = function (uid, material) {
    if (!this.players[uid])
        return;
    var entity = this.players[uid].entity;
    if (entity) {
        entity.script.get('modelHandler').updateVideoMaterial(material);
    }
};

Networking.prototype.assignRemoteAudio = function (uid, stream) {
    //console.log("assigning material ...");
    var entity = this.players[uid].entity;
    if (entity) {
        entity.script.get('remoteAudio').assignRemoteAudio(stream);
    }
};

Networking.prototype.assignRemoteAudioTrack = function (uid, audioTrack) {
    //console.log("assigning material ...");
    var entity = this.players[uid].entity;
    if (entity) {
        entity.script.get('remoteAudio').assignRemoteAudioTrack(audioTrack);
    }
};

Networking.prototype.getPlayers = function () {
    return this.players;
};

Networking.prototype.joinMeeting = function (meetId, callback) {
    Networking.socket.emit("joinMeeting", { meetId }, (index, count) => {
        callback(index, count);
    });
};

Networking.prototype.leaveMeeting = function (meetId) {
    Networking.socket.emit("leaveMeeting", { meetId });
};

// networked objects functions

Networking.prototype.onObjectUpdate = function (data) {
    let obj = Networking.networkedObjects[data.uid];
    if (obj)
        obj.fire('networkedObjectUpdate', data);
};

Networking.prototype.addObject = function (entity) {
    Networking.networkedObjects[entity._guid] = entity;
};

Networking.prototype.claimObject = function (uid) {
    Networking.socket.emit("claimObject", { uid, owner: Networking.id });
};

// swap method called for script hot-reloading
// inherit your script state here
// Networking.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// https://developer.playcanvas.com/en/user-manual/scripting/