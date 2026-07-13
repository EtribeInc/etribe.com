var EventCounter = pc.createScript('eventCounter');

EventCounter.attributes.add("inEvent", {
    type: "string",
    title: "In Event",
    description: "Event name to listen to."
});

EventCounter.attributes.add("count", {
    type: "number",
    title: "Count of inEvent to trigger the outEvent.",
    default: 2
});

EventCounter.attributes.add("timeout", {
    type: "number",
    title: "Time until internal counter will be reset.",
    default: 0.5
});

EventCounter.attributes.add("outEvent", {
    type: "string",
    title: "Out Event",
    description: "Event that gets fired when the conditions are met."
});

// initialize code called once per entity
EventCounter.prototype.initialize = function() {
    this.counter = 0;
    this.entity.on(this.inEvent, ()=> this.handleEvent(), this);
};

EventCounter.prototype.handleEvent = function(){
    console.log("click");
    var self = this;
    if(this.counter === 0){
        this.timer = setTimeout(()=> {
            self.counter = 0;
        }, self.timeout * 1000);
    } 
    this.counter = this.counter + 1;
    if(this.counter >= this.count){
        console.log("Condition met");
        this.entity.fire(this.outEvent);
    }
    console.log(this.counter);
};

// update code called every frame
EventCounter.prototype.update = function(dt) {

};

// swap method called for script hot-reloading
// inherit your script state here
// EventCounter.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// https://developer.playcanvas.com/en/user-manual/scripting/