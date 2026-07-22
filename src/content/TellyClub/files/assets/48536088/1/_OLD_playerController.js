var PlayerController = pc.createScript('playerController');

PlayerController.attributes.add('playerSpeed', {type: 'number', default: 2, title: 'Player Speed'});
PlayerController.attributes.add('playerEntity', {type: 'entity', title: 'Player Entity'});


// initialize code called once per entity
PlayerController.prototype.initialize = function() {
    this.modelHandler = this.entity.script.get("modelHandler");
    
    var characterID = getURLParameter("char")?getURLParameter("char"):0;
    var material = this.entity.script.get("screenMat").screenMaterial.resource;
    console.log(material);
    this.modelHandler.instantiateModel(characterID, material);
    
    this.groundCheckRay = new pc.Vec3(0, 0.5, 0);
    this.rayStart = new pc.Vec3();
    this.rayEnd = new pc.Vec3();
    
    this.direction = new pc.Vec3();
    this.distanceToTravel = 0;
    this.targetPosition = new pc.Vec3();
    
    this.app.on('player:target', this.onNewTarget, this);
    // remove player:move event listeners when script destroyed
    this.on('destroy', function() {
        this.app.off('player:target', this.onNewTarget);
    });
    
    this.angle = 0;
    this.targetAngle = 0;
};

PlayerController.newPosition = new pc.Vec3();


// update code called every frame
PlayerController.prototype.update = function(dt) {
    
    if(Math.abs(this.angle) < Math.abs(this.targetAngle)){
        var step = dt*this.targetAngle*5;
        this.angle += step;
        if(Math.abs(this.angle) > Math.abs(this.targetAngle))
            this.playerEntity.lookAt(this.targetPosition);
        else
            this.entity.rotateLocal(0,step,0);
    } else if (this.direction.lengthSq() > 0) {
        //this.playerEntity.lookAt(this.targetPosition);
        this.app.fire('player:move');
        // Move in the direction at a set speed
        var d = this.playerSpeed * dt;
        var newPosition = PlayerController.newPosition;
       
        newPosition.copy(this.direction).scale(d);
        newPosition.add(this.playerEntity.getPosition()); 
        
        // See if new position is on ground
        this.rayStart.add2(newPosition, this.groundCheckRay);
        this.rayEnd.sub2(newPosition, this.groundCheckRay);
        // Fire a ray straight down to just below the new desired position, 
        // if it hits something then the character will be standing on something.
        var result = this.app.systems.rigidbody.raycastFirst(this.rayStart, this.rayEnd);
        if (result) {
            newPosition = result.point;
            this.playerEntity.setPosition(newPosition);
            this.distanceToTravel -= d;
        } else {
            this.targetPosition.copy(this.playerEntity.getPosition());
            this.distanceToTravel = 0;
        }
          
        
        // If we have reached our destination, clamp the position 
        // and reset the direction
        if (this.distanceToTravel <= 0) {
            //this.playerEntity.setPosition(this.targetPosition);
            this.direction.set(0, 0, 0);
            this.app.fire('player:stop');
        }
    }
};

PlayerController.prototype.onNewTarget = function (worldPosition) {
    this.targetPosition.copy(worldPosition);
        
    // Assuming we are travelling on a flat, horizontal surface, we make the Y the same
    // as the player
    this.targetPosition.y = this.playerEntity.getPosition().y;

    this.distanceTravelled = 0;
    
    // Work out the direction that the player needs to travel in
    this.direction.sub2(this.targetPosition, this.playerEntity.getPosition());
    
    // Get the distance the player needs to travel for
    this.distanceToTravel = this.direction.length();
    

    
    if (this.distanceToTravel > 0) {
        // Ensure the direction is a unit vector
        this.direction.normalize();      
        this.angle = 0;
        this.targetAngle = this.entity.forward.angle(this.direction);
    } else {
        this.direction.set(0, 0, 0);
    }
};
// swap method called for script hot-reloading
// inherit your script state here
// PlayerController.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// http://developer.playcanvas.com/en/user-manual/scripting/