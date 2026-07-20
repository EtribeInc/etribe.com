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
    this.soundSrc = this.entity.sound;
    this.track = 0;

    // playlist comes from the share link now (?music=1..4, 5 = off), no server API
    var idx = parseInt(getURLParameter("music") || '1', 10);
    if (isNaN(idx) || idx < 1) idx = 1;

    if (this.entity.enabled) {
        console.log("Loading Playlist " + idx);
        this.selectMusic(idx);
        this.initialized = true;
    }
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