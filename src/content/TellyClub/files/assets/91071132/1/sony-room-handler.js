var SonyRoomHandler = pc.createScript('sonyRoomHandler');

// initialize code called once per entity
SonyRoomHandler.prototype.initialize = function () {
    var address = getURLParameter("server") ? getURLParameter("server") : stagingServer;
    var port = getURLParameter("port") ? ":" + getURLParameter("port") : ":" + stagingPort;

    address = address.startsWith("https") ? address : "https://" + address;

    var token = getURLParameter("token") ? getURLParameter("token") : 'gwrO1tp!@trY';
    axios({
        method: 'get',
        //url: "https://tcstagelb.cloudbrigade.com/user-api/v1/environment",
        url: address + port + "/user-api/v1/environment",
        // params: {
        //     token: adminToken
        // },
        headers: {
            Authorization: 'Bearer ' + token
        },
        responseType: 'json'
    }).then(res => {
        let index = res.data.environment - 3;
        if (index != undefined && index <= this.entity.children.length) {
            this.entity.children[index].enabled = true;
        }
        console.log(res.data);
    }).catch(error => {
        console.log(error);
    });
};

// update code called every frame
SonyRoomHandler.prototype.update = function (dt) {

};

// swap method called for script hot-reloading
// inherit your script state here
// SonyRoomHandler.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// https://developer.playcanvas.com/en/user-manual/scripting/