var SpatialAudioListener = pc.createScript('spatialAudio_Listener');

// TODO
// Might be better to detach Room attributes from Listener and change those depending on which room/space is entered by the user
// /////////////
SpatialAudioListener.attributes.add("roomDimensions", {
    title: "Room Dimensions",
    type: "json",
    schema: [{
        name: "width",
        type: "number",
        default: 5
    },{
        name: "height",
        type: "number",
        default: 3
    },{
        name: "depth",
        type: "number",
        default: 5
    }]
});

SpatialAudioListener.attributes.add("roomMaterials", {
    title: "Room Materials",
    type: "json",
    schema: [{
        name: "left",
        type: "string",
        default: "brick-painted",
        enum: [
            {'transparent':'transparent'},
            {'acoustic-ceiling-tiles':'acoustic-ceiling-tiles'},
            {'brick-bare':'brick-bare'},
            {'brick-painted':'brick-painted'},
            {'concrete-block-coarse':'concrete-block-coarse'},
            {'concrete-block-painted':'concrete-block-painted'},
            {'curtain-heavy':'curtain-heavy'},
            {'fiber-glass-insulation':'fiber-glass-insulation'},
            {'glass-thin':'glass-thin'},
            {'glass-thick':'glass-thick'},
            {'grass':'grass'},
            {'linoleum-on-concrete':'linoleum-on-concrete'},
            {'marble':'marble'},
            {'metal':'metal'},
            {'parquet-on-concrete':'parquet-on-concrete'},
            {'plaster-smooth':'plaster-smooth'},
            {'plywood-panel':'plywood-panel'},
            {'polished-concrete-or-tile':'polished-concrete-or-tile'},
            {'sheetrock':'sheetrock'},
            {'water-or-ice-surface':'water-or-ice-surface'},
            {'wood-ceiling':'wood-ceiling'},
            {'wood-panel':'wood-panel'},
            {'uniform':'uniform'}
        ]
    },{
        name: "right",
        type: "string",
        default: "brick-painted",
        enum: [
            {'transparent':'transparent'},
            {'acoustic-ceiling-tiles':'acoustic-ceiling-tiles'},
            {'brick-bare':'brick-bare'},
            {'brick-painted':'brick-painted'},
            {'concrete-block-coarse':'concrete-block-coarse'},
            {'concrete-block-painted':'concrete-block-painted'},
            {'curtain-heavy':'curtain-heavy'},
            {'fiber-glass-insulation':'fiber-glass-insulation'},
            {'glass-thin':'glass-thin'},
            {'glass-thick':'glass-thick'},
            {'grass':'grass'},
            {'linoleum-on-concrete':'linoleum-on-concrete'},
            {'marble':'marble'},
            {'metal':'metal'},
            {'parquet-on-concrete':'parquet-on-concrete'},
            {'plaster-smooth':'plaster-smooth'},
            {'plywood-panel':'plywood-panel'},
            {'polished-concrete-or-tile':'polished-concrete-or-tile'},
            {'sheetrock':'sheetrock'},
            {'water-or-ice-surface':'water-or-ice-surface'},
            {'wood-ceiling':'wood-ceiling'},
            {'wood-panel':'wood-panel'},
            {'uniform':'uniform'}
        ]
    },{
        name: "front",
        type: "string",
        default: "brick-painted",
        enum: [
            {'transparent':'transparent'},
            {'acoustic-ceiling-tiles':'acoustic-ceiling-tiles'},
            {'brick-bare':'brick-bare'},
            {'brick-painted':'brick-painted'},
            {'concrete-block-coarse':'concrete-block-coarse'},
            {'concrete-block-painted':'concrete-block-painted'},
            {'curtain-heavy':'curtain-heavy'},
            {'fiber-glass-insulation':'fiber-glass-insulation'},
            {'glass-thin':'glass-thin'},
            {'glass-thick':'glass-thick'},
            {'grass':'grass'},
            {'linoleum-on-concrete':'linoleum-on-concrete'},
            {'marble':'marble'},
            {'metal':'metal'},
            {'parquet-on-concrete':'parquet-on-concrete'},
            {'plaster-smooth':'plaster-smooth'},
            {'plywood-panel':'plywood-panel'},
            {'polished-concrete-or-tile':'polished-concrete-or-tile'},
            {'sheetrock':'sheetrock'},
            {'water-or-ice-surface':'water-or-ice-surface'},
            {'wood-ceiling':'wood-ceiling'},
            {'wood-panel':'wood-panel'},
            {'uniform':'uniform'}
        ]
    },{
        name: "back",
        type: "string",
        default: "brick-bare",
        enum: [
            {'transparent':'transparent'},
            {'acoustic-ceiling-tiles':'acoustic-ceiling-tiles'},
            {'brick-bare':'brick-bare'},
            {'brick-painted':'brick-painted'},
            {'concrete-block-coarse':'concrete-block-coarse'},
            {'concrete-block-painted':'concrete-block-painted'},
            {'curtain-heavy':'curtain-heavy'},
            {'fiber-glass-insulation':'fiber-glass-insulation'},
            {'glass-thin':'glass-thin'},
            {'glass-thick':'glass-thick'},
            {'grass':'grass'},
            {'linoleum-on-concrete':'linoleum-on-concrete'},
            {'marble':'marble'},
            {'metal':'metal'},
            {'parquet-on-concrete':'parquet-on-concrete'},
            {'plaster-smooth':'plaster-smooth'},
            {'plywood-panel':'plywood-panel'},
            {'polished-concrete-or-tile':'polished-concrete-or-tile'},
            {'sheetrock':'sheetrock'},
            {'water-or-ice-surface':'water-or-ice-surface'},
            {'wood-ceiling':'wood-ceiling'},
            {'wood-panel':'wood-panel'},
            {'uniform':'uniform'}
        ]
    },{
        name: "down",
        type: "string",
        default: "parquet-on-concrete",
        enum: [
            {'transparent':'transparent'},
            {'acoustic-ceiling-tiles':'acoustic-ceiling-tiles'},
            {'brick-bare':'brick-bare'},
            {'brick-painted':'brick-painted'},
            {'concrete-block-coarse':'concrete-block-coarse'},
            {'concrete-block-painted':'concrete-block-painted'},
            {'curtain-heavy':'curtain-heavy'},
            {'fiber-glass-insulation':'fiber-glass-insulation'},
            {'glass-thin':'glass-thin'},
            {'glass-thick':'glass-thick'},
            {'grass':'grass'},
            {'linoleum-on-concrete':'linoleum-on-concrete'},
            {'marble':'marble'},
            {'metal':'metal'},
            {'parquet-on-concrete':'parquet-on-concrete'},
            {'plaster-smooth':'plaster-smooth'},
            {'plywood-panel':'plywood-panel'},
            {'polished-concrete-or-tile':'polished-concrete-or-tile'},
            {'sheetrock':'sheetrock'},
            {'water-or-ice-surface':'water-or-ice-surface'},
            {'wood-ceiling':'wood-ceiling'},
            {'wood-panel':'wood-panel'},
            {'uniform':'uniform'}
        ]
    },{
        name: "up",
        type: "string",
        default: "wood-ceiling",
        enum: [
            {'transparent':'transparent'},
            {'acoustic-ceiling-tiles':'acoustic-ceiling-tiles'},
            {'brick-bare':'brick-bare'},
            {'brick-painted':'brick-painted'},
            {'concrete-block-coarse':'concrete-block-coarse'},
            {'concrete-block-painted':'concrete-block-painted'},
            {'curtain-heavy':'curtain-heavy'},
            {'fiber-glass-insulation':'fiber-glass-insulation'},
            {'glass-thin':'glass-thin'},
            {'glass-thick':'glass-thick'},
            {'grass':'grass'},
            {'linoleum-on-concrete':'linoleum-on-concrete'},
            {'marble':'marble'},
            {'metal':'metal'},
            {'parquet-on-concrete':'parquet-on-concrete'},
            {'plaster-smooth':'plaster-smooth'},
            {'plywood-panel':'plywood-panel'},
            {'polished-concrete-or-tile':'polished-concrete-or-tile'},
            {'sheetrock':'sheetrock'},
            {'water-or-ice-surface':'water-or-ice-surface'},
            {'wood-ceiling':'wood-ceiling'},
            {'wood-panel':'wood-panel'},
            {'uniform':'uniform'}
        ]
    },]
});



// initialize code called once per entity
SpatialAudioListener.prototype.init = function() {
    // Create an AudioContext
    this.app.systems.sound.context.close();
    this.audioContext = new window.AudioContext();

    // Create a (first-order Ambisonic) Resonance Audio scene and pass it the AudioContext.
    this.resonanceAudioScene = new ResonanceAudio(this.audioContext);
    
    // Connect the scene’s binaural output to stereo out.
    this.resonanceAudioScene.output.connect(this.audioContext.destination); 
    
    // set up room
    this.setRoom();

};

// update code called every frame
SpatialAudioListener.prototype.update = function(dt) {
    
    if(!this.resonanceAudioScene)
        return;
    
    var pos = this.entity.getPosition();
    var up = this.entity.up;
    var forward = this.entity.forward;
    
    // update position and orientation of AudioListener on every frame
    this.resonanceAudioScene.setListenerPosition(pos.x, pos.y, pos.z);
    this.resonanceAudioScene.setListenerOrientation(forward.x, forward.y, forward.z, up.x, up.y, up.z);
};

SpatialAudioListener.prototype.setRoom = function(){
    
    // Define room dimensions.
    // By default, room dimensions are undefined (0m x 0m x 0m).
    let roomDimensions = {
        width: this.roomDimensions.width,
        height: this.roomDimensions.height,
        depth: this.roomDimensions.depth,
    };
    
    // Define materials for each of the room’s six surfaces.
    // Room materials have different acoustic reflectivity.
    let roomMaterials = {
        // Room wall materials
        left: this.roomMaterials.left,
        right: this.roomMaterials.right,
        front: this.roomMaterials.front,
        back: this.roomMaterials.back,
        // Room floor
        down: this.roomMaterials.down,
        // Room ceiling
        up: this.roomMaterials.up,
    };
    
    // Add the room definition to the scene.
    this.resonanceAudioScene.setRoomProperties(roomDimensions, roomMaterials);
    
};

// swap method called for script hot-reloading
// inherit your script state here
// SpatialAudioListener.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// https://developer.playcanvas.com/en/user-manual/scripting/