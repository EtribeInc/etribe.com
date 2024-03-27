var MusicHandler = pc.createScript('musicHandler');

MusicHandler.attributes.add('dynamicSlotVolume', {
    type: 'number',
    title: "Dynamic Slot Volume",
    default: 0.5
});

MusicHandler.attributes.add('ambient', {
    type: 'asset',
    title: "Ambient Playlist",
    assetType: "audio",
    array: true
});

MusicHandler.attributes.add('lofi', {
    type: 'asset',
    title: "LoFi Playlist",
    assetType: "audio",
    array: true
});

MusicHandler.attributes.add('party', {
    type: 'asset',
    title: "Party Playlist",
    assetType: "audio",
    array: true
});

MusicHandler.attributes.add('upbeat', {
    type: 'asset',
    title: "Upbeat Playlist",
    assetType: "audio",
    array: true
});

// initialize code called once per entity
MusicHandler.prototype.initialize = function() {
    this.initMusic();
    this.on("state", (state)=>{
        console.log(state);
        if(state && !this.initialized)
            this.initMusic();
    }, this);
};

MusicHandler.prototype.initMusic = function(){
    var self = this;
    this.soundSrc = this.entity.sound;
    this.track = 0;

    var address = getURLParameter("server")?getURLParameter("server"):stagingServer;
    address = address.startsWith("http")?address:"https://"+address;

    var port = getURLParameter("port")?":"+getURLParameter("port"):":"+stagingPort;

    var token = getURLParameter("token")?getURLParameter("token"):'gwrO1tp!@trY';

    axios({
        method: 'get',
        //url: "https://tcstagelb.cloudbrigade.com/user-api/v1/environment",
        url: address+port+"/user-api/v1/music",
        // params: {
        //     token: adminToken
        // },
        headers: {
            Authorization: 'Bearer ' + token
        },
        responseType: 'json'
    })
    .then(res => {
        if(self.entity.enabled){
            var idx = res.data.music;
            console.log("Loading Playlist "+ idx);
            self.selectMusic(idx);
            self.initialized = true;
        }
    })
    .catch(error => {
        console.log(error);
    });

};

// update code called every frame
MusicHandler.prototype.update = function(dt) {

};

MusicHandler.prototype.selectMusic = function(playlist) {
    let songs;
    switch(playlist){
        case 1:
            songs = this.ambient;
            break;
        case 2:
            songs = this.lofi;
            break;
        case 3:
            songs = this.party;
            break;
        case 4:
            songs = this.upbeat;
            break;
        case 5:
        default:
            this.entity.sound.stop();
            return;
    }

    this.entity.sound.slots = null;
    for(i=0; i<songs.length; i++){
        this.entity.sound.addSlot(i.toString(), {
            asset: songs[i],
            volume: this.dynamicSlotVolume
        });
    }
    this.track = 0;
    this.entity.sound.play(this.track.toString());
    this.entity.sound.on("end", ()=>{
        this.track++;
        this.track = this.track > songs.length-1? 0 : this.track;
        this.entity.sound.play(this.track.toString());
    });
};

// swap method called for script hot-reloading
// inherit your script state here
// MusicHandler.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// https://developer.playcanvas.com/en/user-manual/scripting/