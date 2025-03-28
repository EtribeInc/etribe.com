var HtmlVideoOverlay = pc.createScript('htmlVideoOverlay');

HtmlVideoOverlay.attributes.add('video', {
    title: 'Video',
    description: 'MP4 video asset to play back on this video texture.',
    type: 'asset'
});
HtmlVideoOverlay.attributes.add('readyEvent', {
    title: 'Ready Event',
    description: 'Event that is fired as soon as the video texture is ready to play.',
    type: 'string',
    default: ''
});
HtmlVideoOverlay.attributes.add('playEvent', {
    title: 'Play Event',
    description: 'Event to listen to for start playing the video.',
    type: 'string',
    default: 'video:play'
});

// initialize code called once per entity
HtmlVideoOverlay.prototype.initialize = function() {
    var app = this.app;
    
    // Create HTML Video Element to play the video
    var video = document.createElement('video');
    //video.autoplay = true;
    video.crossOrigin = 'anonymous';
    video.loop = true;

    // muted attribute is required for videos to autoplay
    video.muted = true;

    // critical for iOS or the video won't initially play, and will go fullscreen when playing
    video.playsInline = true;

    // set video source
    video.src = this.video.getFileUrl();

    // iOS video texture playback requires that you add the video to the DOMParser
    // with at least 1x1 as the video's dimensions
    var style = video.style;
    style.width = '512px';
    style.height= '256px';
    style.position= 'absolute';
    style.display= 'none';
    /* opacity: 0; */
    style.zIndex= '1';
    style.pointerEvents= 'none';
    style.left= '50%';
    style.top= '50%';
    style.transform= 'translate(-256px, -128px)';

    document.body.appendChild(video);

    // Create a texture to hold the video frame data            
    this.videoTexture = new pc.Texture(app.graphicsDevice, {
        format: pc.PIXELFORMAT_R8_G8_B8,
        minFilter: pc.FILTER_LINEAR_MIPMAP_LINEAR,
        magFilter: pc.FILTER_LINEAR,
        addressU: pc.ADDRESS_CLAMP_TO_EDGE,
        addressV: pc.ADDRESS_CLAMP_TO_EDGE,
        mipmaps: true,
        autoMipmap: true
    });
    this.videoTexture.setSource(video);

    video.addEventListener('canplay', function (e) {
        //app.fire(this.readyEvent, this.videoTexture);
    }.bind(this));

    this.app.on(this.playEvent, ()=>{
        video.style.display = "block";
        video.play();
    });

    this.entity.on("destroy", ()=>video.remove());
};

// update code called every frame
HtmlVideoOverlay.prototype.update = function(dt) {
    // Transfer the latest video frame to the video texture
    this.videoTexture.upload();
};
