var RemoteAduioListener = pc.createScript('remoteAduioListener');

// initialize code called once per entity
RemoteAduioListener.prototype.initialize = function() {
    this.context = this.app.systems.sound.context;

    this.listener = this.context.listener;
    
    var pos = this.entity.getPosition();
    
    this.listener.positionX.value = pos.x;
    this.listener.positionY.value = pos.y;
    this.listener.positionZ.value = pos.z;
    
    this.listener.forwardX.value = this.entity.forward.x;
    this.listener.forwardY.value = this.entity.forward.y;
    this.listener.forwardZ.value = this.entity.forward.z;
    
    this.listener.upX.value = this.entity.up.x;
    this.listener.upY.value = this.entity.up.y;
    this.listener.upZ.value = this.entity.up.z;
};

// update code called every frame
RemoteAduioListener.prototype.update = function(dt) {
    var pos = this.entity.getPosition();
    
    this.listener.positionX.value = pos.x;
    this.listener.positionY.value = pos.y;
    this.listener.positionZ.value = pos.z;
    
    this.listener.forwardX.value = this.entity.forward.x;
    this.listener.forwardY.value = this.entity.forward.y;
    this.listener.forwardZ.value = this.entity.forward.z;
    
    this.listener.upX.value = this.entity.up.x;
    this.listener.upY.value = this.entity.up.y;
    this.listener.upZ.value = this.entity.up.z;
};

// swap method called for script hot-reloading
// inherit your script state here
// RemoteAduioListener.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// https://developer.playcanvas.com/en/user-manual/scripting/