/*jshint esversion: 9 */

var VideoInterface = pc.createScript('videoInterface');

VideoInterface.instance = null;

// initialize code called once per entity
VideoInterface.prototype.initialize = function() {
    VideoInterface.instance = this;
};

// update code called every frame
VideoInterface.prototype.update = function(dt) {
    
};

/*
 * On initiation no users are connected.
 */
VideoInterface.prototype.remoteUsers = {};

VideoInterface.prototype.options = {
    appid: null,
    channel: null,
    uid: null,
    token: null
};

/*
* Clear the video and audio tracks used by `client` on initiation.
*/
VideoInterface.prototype.localTracks = {
    videoTrack: null,
    audioTrack: null
};

// update code called every frame
VideoInterface.prototype.connect = async function(appid, uid, channel, token) {
    var self = this;
    
    //Only log Agora errors
    AgoraRTC.setLogLevel(4);
    self.client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    
    self.options.appid = appid;
    self.options.uid = uid;
    self.options.channel = channel;
    self.options.token = token;
    
    // Add an event listener to play remote tracks when remote user publishes.
    self.client.on("user-published", self.handleUserPublished);
    self.client.on("user-unpublished", self.handleUserUnpublished);
    self.client.on("token-privilege-will-expire", ()=>{
        self.entity.script.networking.getNewVideoToken();
    });

    // Join a channel
    self.options.uid = await self.client.join(self.options.appid, self.options.channel, self.options.token, self.options.uid);
    console.log("connected");
};

VideoInterface.prototype.renewToken = async function(token){
    await this.client.renewToken(token);
    console.log("Video token renewed.");
};

VideoInterface.prototype.muteVideo = function(bool){
    console.log("Muting Video: " + bool.toString());
    this.localTracks.videoTrack.setEnabled(!bool);
};

VideoInterface.prototype.muteAudio = function(bool){
    console.log("Muting Audio: " + bool.toString());
    this.localTracks.audioTrack.setEnabled(!bool);
};

VideoInterface.prototype.publish = async function(stream){
    var self = this;

    var videoMediaStreamTrack = stream.getVideoTracks()[0];
    this.localTracks.videoTrack = await AgoraRTC.createCustomVideoTrack({
        mediaStreamTrack: videoMediaStreamTrack
    });

    var audioStream;

    if(this.app.audioInputDevice){
        this.localTracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack({microphoneId: this.app.audioInputDevice, AEC: true, ANS: true});
        //audioStream = await navigator.mediaDevices.getUserMedia({audio: {deviceId: this.app.audioInputDevice, echoCancellation: true, noiseSuppression: true}, video: false});
    } else {
        this.localTracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack({AEC: true, ANS: true});
        //audioStream = await navigator.mediaDevices.getUserMedia({audio: {echoCancellation: true, noiseSuppression: true}, video: false});
    }

    //var audioMediaStreamTrack = audioStream.getAudioTracks()[0];

    // this.localTracks.audioTrack = await AgoraRTC.createCustomAudioTrack({
    //     mediaStreamTrack: audioMediaStreamTrack
    // });
    
    // var localStream = await AgoraRTC.createStream({
    //     video: true,
    //     audio: true,
    //     videoSource: this.localTracks.videoTrack,
    //     audioSource: this.localTracks.audioTrack
    // });
    // Publish the local video and audio tracks to the channel.
    await self.client.publish(Object.values(self.localTracks));
    
    this.entity.on('audio:input', async (id)=>{
        await self.client.unpublish(self.localTracks.audioTrack);
        console.log(id);
        //var audioStream = await navigator.mediaDevices.getUserMedia({audio: {deviceId: id, echoCancellation: true, noiseSuppression: true}, video: false});
        //var audioMediaStreamTrack = audioStream.getAudioTracks()[0];

        // self.localTracks.audioTrack = await AgoraRTC.createCustomAudioTrack({
        //     mediaStreamTrack: audioMediaStreamTrack
        // });
        self.localTracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack({microphoneId: id, AEC: true, ANS: true});

        console.log(self.localTracks.audioTrack);

        await self.client.publish(self.localTracks.audioTrack);

    },this);

    this.entity.on('mute:video', (bool)=>{
        this.muteVideo(bool);
    }, this);

    window.addEventListener("blur", ()=>{
        this.muteVideo(true);
    });

    window.addEventListener("focus", ()=>{
        this.muteVideo(!this.app.videoToggle);
    });

    this.muteVideo(!this.app.videoToggle);

    this.entity.on('mute:voice', (bool)=>{
        this.muteAudio(bool);
    }, this);

    this.muteAudio(!this.app.micToggle);

    console.log("publish success");
};

VideoInterface.prototype.muteVoice = function() {

};

/*
 * Add the local use to a remote channel.
 *
 * @param  {IAgoraRTCRemoteUser} user - The {@link  https://docs.agora.io/en/Voice/API%20Reference/web_ng/interfaces/iagorartcremoteuser.html| remote user} to add.
 * @param {trackMediaType - The {@link https://docs.agora.io/en/Voice/API%20Reference/web_ng/interfaces/itrack.html#trackmediatype | media type} to add.
 */
VideoInterface.prototype.subscribeToRemote = async function(user, mediaType) {
    console.log("subscribing ...");
    const uid = user.uid;
    if (mediaType === 'video') {
        // subscribe to a remote user
        var subscribe = async function(){
            await VideoInterface.instance.client.subscribe(user, mediaType);
            console.log("video subscribe success");
            //user.videoTrack.play(document.body);
            var stream = new MediaStream([user.videoTrack.getMediaStreamTrack()]);
            VideoInterface.instance.fire("newRemoteStream", {uid, remoteStream: stream});
        };
        
        subscribe();
    } else if (mediaType === 'audio'){
        await VideoInterface.instance.client.subscribe(user, mediaType);
        console.log("audio subscribe success");
        //user.videoTrack.play(document.body);
        if(!this.app.fallBackAudio){
            var stream = new MediaStream([user.audioTrack.getMediaStreamTrack()]);
            VideoInterface.instance.fire("newAudioStream", {uid, remoteStream: stream});
        } else{
            user.audioTrack.play();
            
            console.log(user.audioTrack);
            console.log(user.audioTrack.getVolumeLevel());
            VideoInterface.instance.fire("newAudioTrack", {uid, audioTrack: user.audioTrack});
        }
    }
};

VideoInterface.prototype.subscribeToScreenShare = async function(user, mediaType){
    var self = VideoInterface.instance;
    const uid = user.uid;
    if (mediaType === 'video') {
        // subscribe to a remote user
        await VideoInterface.instance.client.subscribe(user, mediaType);
        console.log("Screen share video subscribe success");
        //user.videoTrack.play(document.body);
        //var stream = new MediaStream([user.videoTrack.getMediaStreamTrack()]);
        let screenElem = document.getElementById(uid);
        if(!screenElem){
            screenElem = document.createElement('div');
            screenElem.setAttribute("id", uid);
            document.body.append(screenElem);
        }
        user.videoTrack.play(screenElem);
        self.app.fire("screen:newRemoteVideo", uid, screenElem.querySelector("video"));

    } else if (mediaType === 'audio'){
        await VideoInterface.instance.client.subscribe(user, mediaType);
        console.log("Sreen share audio subscribe success");
        //user.videoTrack.play(document.body);
        if(!self.app.fallBackAudio){
            var stream = new MediaStream([user.audioTrack.getMediaStreamTrack()]);
            self.app.fire("screen:newAudioStream", uid, stream);
        } else{
            user.audioTrack.play();
            console.log(user.audioTrack);
            console.log(user.audioTrack.getVolumeLevel());
            self.app.fire("screen:newAudioTrack", uid, user.audioTrack);
        }
    }
};

/*
 * Add a user who has subscribed to the live channel to the local interface.
 *
 * @param  {IAgoraRTCRemoteUser} user - The {@link  https://docs.agora.io/en/Voice/API%20Reference/web_ng/interfaces/iagorartcremoteuser.html| remote user} to add.
 * @param {trackMediaType - The {@link https://docs.agora.io/en/Voice/API%20Reference/web_ng/interfaces/itrack.html#trackmediatype | media type} to add.
 */
VideoInterface.prototype.handleUserPublished = function(user, mediaType) {
    if(user.uid.includes("ScreenShare_")){
        console.log("Screen Share stream published. Subscribing ...");
        VideoInterface.instance.subscribeToScreenShare(user, mediaType);
        return;
    }
    console.log("Handle User Published");
    const id = user.uid;
    VideoInterface.instance.remoteUsers[id] = user;
    VideoInterface.instance.subscribeToRemote(user, mediaType);
};

/*
 * Remove the user specified from the channel in the local interface.
 *
 * @param  {string} user - The {@link  https://docs.agora.io/en/Voice/API%20Reference/web_ng/interfaces/iagorartcremoteuser.html| remote user} to remove.
 */
VideoInterface.prototype.handleUserUnpublished = function(user) {
    if(user.uid.includes("ScreenShare_")){
        console.log("Screen Share stream unpublished. Cleaning up ...");
        VideoInterface.instance.app.fire("screen:unpublished", user.uid);
        return;
    }
    const id = user.uid;
    delete this.remoteUsers[id];

    VideoInterface.instance.fire("userUnpublished", user);
};


VideoInterface.prototype.setup = function(){
    
};

// swap method called for script hot-reloading
// inherit your script state here
// VideoInterface.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// http://developer.playcanvas.com/en/user-manual/scripting/