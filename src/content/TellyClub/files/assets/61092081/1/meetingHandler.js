var MeetingHandler = pc.createScript('meetingHandler');

MeetingHandler.attributes.add("spotMaterial", {
    type: "asset",
    assetType: "material",
    title: "Spot Material"
});

MeetingHandler.attributes.add("minMeetingRadius", {
    type: "number",
    default: 1,
    title: "Minimum Meeting Radius"
});

MeetingHandler.attributes.add("minAttendeeSpacing", {
    type: "number",
    default: 0.5,
    title: "Minimum Attendee Spacing"
});

MeetingHandler.attributes.add("maxDistance", {
    type: "number",
    default: 2,
    title: "Max Distance",
    description: "Max distance before player leaves meeting."
});

MeetingHandler.attributes.add("meetingEntity", {
    type: "entity",
    title: "Meeting Collider Object"
});

MeetingHandler.attributes.add("meetingIcon", {
    type: "entity",
    title: "Meeting Icon Entity"
});

MeetingHandler.attributes.add("customSpots", {
    type: "boolean",
    title: "Custom Spots",
    default: false
});

MeetingHandler.attributes.add("spotPositions", {
    title: "Spot Positions",
    description: "Entitys to define positions for custom spots.",
    type: "entity",
    array: true
});

MeetingHandler.prototype.initialize = function() {
    this.numberOfAttendees = 0;
    this.attendeeSpots = [];
    this.radius = this.minMeetingRadius;
    this.meetId = this.entity._guid;

    this.playerIndex = null;

    this.meetingEntity.on("meeting:join", this.onMeetingJoin, this);
    this.app.on("meeting:indexChange", this.onIndexChange, this);

    this.app.on("player:inMotion", ()=>{
        if(this.inMeeting){
            console.log("Moving ... leaving meeting.");
            this.app.fire("networking:leaveMeeting", this.meetId);
            this.inMeeting = false;
            if(this.meetingIcon)
                this.meetingIcon.enabled = true;
            this.checkDistance = false;
            this.targetPos = undefined;
            this.app.fire("convo:force", false);
        }
    }, this);
    this.on("destroy", () => {
        this.meetingEntity.off("meeting:join", this.onMeetingJoin, this);
        this.app.off("meeting:indexChange", this.onIndexChange);
        this.app.off("player:moving");
    });

};

MeetingHandler.prototype.update = function(dt) {
    if (this.targetPos && this.meetingEntity.getPosition().distance(this.app.playerEntity.getPosition()) < this.maxDistance)
        this.checkDistance = true;
    if(this.inMeeting && this.checkDistance)
        if(this.meetingEntity.getPosition().distance(this.app.playerEntity.getPosition()) >= this.maxDistance){
            console.log("Distance from meeting to big ... leaving.");
            this.app.fire("player:inMotion");
        }
};

MeetingHandler.prototype.onIndexChange = function(meetId, index, count){
    console.log(this.meetId + " " + meetId);
    if(this.meetId === meetId){
        if(this.customSpots){
            this.targetPos = this.spotPositions[index].getPosition();
        } else {
            this.targetPos = this.entity.getPosition().clone().add(this.getSpotPosition(index, count));
        }
        let lookAt = this.entity.getPosition().clone();
        // Change Playerpos to updated index position
        //
        this.app.fire('player:adjust', this.targetPos, lookAt);
    }
};

MeetingHandler.prototype.onMeetingJoin = function() {
    if(!this.inMeeting){
        this.app.fire("networking:joinMeeting", this.meetId, ({index, count})=>{
            //let newPos = this.getSpotPosition(index, count);
            // Change Playerpos to updated index position
            //
            //this.app.fire('player:target', this.entity.getPosition().add(newPos));
            if(this.meetingIcon)
                this.meetingIcon.enabled = false;
            this.inMeeting = true;
            this.app.fire("convo:force", true);
        });
        //this.addAttendee();
    }
};

MeetingHandler.prototype.addAttendee = function() {
    this.numberOfAttendees++;

    var newEntity = new pc.Entity();
    newEntity.addComponent("model", {
        type: 'plane',
    });
    newEntity.model.material = this.spotMaterial.resource;
    this.entity.addChild(newEntity);
    this.attendeeSpots.push(newEntity);

    for (var i = 0; i < this.numberOfAttendees; i++) {
        this.updatePosition(i);
    }
};

MeetingHandler.prototype.getSpotPosition = function(index, numberOfAttendees){
    var direction = new pc.Vec3();
    var q = new pc.Quat();

    let distance = (360 / numberOfAttendees) * (Math.PI/180)*this.radius;
    if(distance < this.minAttendeeSpacing)
        this.radius = this.minAttendeeSpacing/((360 / numberOfAttendees) * (Math.PI/180));


    q.setFromAxisAngle(pc.Vec3.UP, index * (360 / numberOfAttendees));
    q.transformVector(this.entity.forward.mulScalar(this.radius), direction);
    let newPos = direction.mulScalar(this.minMeetingRadius);
    
    return newPos;
};

MeetingHandler.prototype.updateSpot = function(index, numberOfAttendees) {
    
    let pos = this.getSpotPosition(index, numberOfAttendees);
    this.attendeeSpots[index].tween(this.attendeeSpots[index].getLocalPosition()).to(pos,1.0,pc.SineInOut).start();
};
