var SceneChanger = pc.createScript('sceneChanger');

SceneChanger.attributes.add('sceneNames', {
    title: "Scene Names",
    type: "string",
    array: true
});

SceneChanger.attributes.add('delay', {
    title: "Scene Change Delay",
    type: "number"
});

// initialize code called once per entity
SceneChanger.prototype.initialize = function () {
    console.log(this.app.environment);
    console.log(this.sceneNames);
    this.loading = false;
    var self = this;

    var address = getURLParameter("server") ? getURLParameter("server") : stagingServer;
    var port = getURLParameter("port") ? ":" + getURLParameter("port") : ":" + stagingPort;

    address = address.startsWith("https") ? address : "https://" + address;

    var token = getURLParameter("token") ? getURLParameter("token") : 'gwrO1tp!@trY';
    if (this.app.environment == undefined && this.app.environmentApi != true) {
        this.app.environmentApi = true;
        console.log("Getting environment ...");
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
            // if (getURLParameter("char") && !this.loading) {
            //     let index = res.data.environment > this.sceneNames.length ? this.sceneNames.length - 1 : res.data.environment - 1;
            //     var name = this.sceneNames[index];
            //     console.log("Loading scene " + name);
            //     this.loadScene(name);
            // }
            self.app.environment = res.data.environment;
            self.app.fire("environment:set");
            console.log(res.data);
        }).catch(error => {
            self.app.environment = 1;
            console.log(error);
        });
    }

    this.app.on('sceneChange:loadScene', async function (event) {
        console.log("Event fired - sceneChange:loadScene");
        if (!self.loading) {
            let load = () => {
                let index = self.app.environment > self.sceneNames.length ? self.sceneNames.length - 1 : self.app.environment - 1;
                var name = self.sceneNames[index];
                console.log("Loading scene " + name);
                self.loadScene(name);
            };
            if (self.app.environment == undefined) {
                self.app.on("environment:set", load, self);
            } else
                load();
        }
    }, self);
};

SceneChanger.prototype.loadScene = async function (sceneName) {
    console.log("Async load ...");
    this.app.off('sceneChange:loadScene');
    this.app.off("environment:set");
    this.loading = true;

    // Get a reference to the scene's root object
    var oldHierarchy = this.app.root.findByName('Root');

    // Get the path to the scene
    var scene = this.app.scenes.find(sceneName);
    var self = this;
    // Load the scenes entity hierarchy

    await new Promise(r => setTimeout(r, this.delay * 1000));

    self.app.scenes.loadSceneSettings(scene.url, function (err, parent) {
        if (!err) {
            self.app.scenes.loadSceneHierarchy(scene.url, function (err, parent) {
                if (!err) {
                    self.app.fire('sceneChanger:complete');
                    oldHierarchy.destroy();
                } else {
                    self.app.fire('sceneChanger:failed');
                    console.error(err);
                    self.loading = false;

                }
            });
        } else {
            self.app.fire('sceneChanger:failed');
            console.error(err);
            self.loading = false;

        }
    });
};