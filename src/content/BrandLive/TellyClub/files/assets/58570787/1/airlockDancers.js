var AirlockDancers = pc.createScript('airlockDancers');

AirlockDancers.attributes.add('mobileShelfTelly', {type: 'entity', title: 'Mobile Shelf Telly Parent'});
AirlockDancers.attributes.add('desktopShelfTelly', {type: 'entity', title: 'Desktop Shelf Telly Parent'});

AirlockDancers.prototype.postInitialize = function() {
    var self = this;
    var shelfTellyParent = this.mobileShelfTelly.enabled == true ? this.mobileShelfTelly : this.desktopShelfTelly;
    this.shelfTelly = this.shuffle(shelfTellyParent.children);
    this.isWaving = false;

    this.finish = false;
    this.timer = 0.0;
    
    this.initialWait = 3;
    this.warmUpPeriod = 18;
    this.chorusLineStart = 35.5;
    
    this.motionPickerInterval = setInterval(this.motionPicker, 2000, self);
    
    this.app.on('tubeExitHandler:start', this.finishDance, this);
    this.on('destroy', function() {
        if (this.motionPickerInterval)
            clearInterval(this.motionPickerInterval);
        this.app.off('tubeExitHandler:start', this.finishDance, this);
    });

    for (let i = 0; i < self.shelfTelly.length; i++) {
        self.shelfTelly[i].anim.baseLayer.transition("Idle", 0.0, Math.random());

        let upperbodyLayer = this.shelfTelly[i].anim.findAnimationLayer('UpperBody');
        upperbodyLayer.assignMask({
            "RootNode": false,
            "RootNode/Bip001": false,
            "RootNode/Bip001/Bip001 Footsteps": false,
            "RootNode/Bip001/Bip001 Pelvis": false,
            "RootNode/Bip001/Bip001 Pelvis/Bip001 Spine": false,
            "RootNode/Bip001/Bip001 Pelvis/Bip001 Spine/Bip001 Spine1": {
                children: true
            },
        });
    }
};

AirlockDancers.prototype.motionPicker = function(self) {
    var hasDancer = false;
    var hasWavers = 0;
    if (self.timer < self.initialWait) return;
    if (self.timer < self.warmUpPeriod) {
        for (let i = 0; i < self.shelfTelly.length; i++) {
            let r = Math.random();
            if (r < 0.1 && !hasDancer) {
                setTimeout(self.shelfTelly[i].script.airlockAnim.dance(), Math.random() * (1500 - 250) + 250);
                hasDancer = true;
            } else if (r < 0.35 && hasWavers < 2) {
                setTimeout(self.shelfTelly[i].script.airlockAnim.wave(), Math.random() * (1500 - 250) + 250);
                hasWavers++;
            } else
                setTimeout(self.shelfTelly[i].script.airlockAnim.idle(), Math.random() * (1500 - 250) + 250);
        }
        return;
    }
    if (self.timer < self.chorusLineStart - 2) {
        for (let i = 0; i < self.shelfTelly.length; i++) {
            let r = Math.random();
            if (self.shelfTelly[i].anim.getBoolean("Dance")) {
                if (r < 0.45) setTimeout(self.shelfTelly[i].script.airlockAnim.dance(), Math.random() * (1500 - 250) + 250);
                else if (r < 0.65) setTimeout(self.shelfTelly[i].script.airlockAnim.wave(), Math.random() * (1500 - 250) + 250);
                else setTimeout(self.shelfTelly[i].script.airlockAnim.idle(), Math.random() * (1500 - 250) + 250);
            } else {
                if (r < 0.2) setTimeout(self.shelfTelly[i].script.airlockAnim.dance(), Math.random() * (1500 - 250) + 250);
                else if (r < 0.4) setTimeout(self.shelfTelly[i].script.airlockAnim.wave(), Math.random() * (1500 - 250) + 250);
                else setTimeout(self.shelfTelly[i].script.airlockAnim.idle(), Math.random() * (1500 - 250) + 250);
            }
        }
        return;
    }
    if (self.timer < self.chorusLineStart) {
        for (let i = 0; i < self.shelfTelly.length; i++) {
            setTimeout(self.shelfTelly[i].script.airlockAnim.idle(), Math.random() * (1500 - 250) + 250);
        }
        return;
    }
    for (let i = 0; i < self.shelfTelly.length; i++) {
        self.shelfTelly[i].script.airlockAnim.dance();
    }
    self.finish = true;
    clearInterval(self.motionPickerInterval);
};

AirlockDancers.prototype.finishDance = function() {
    for (let i = 0; i < this.shelfTelly.length; i++) {
        this.shelfTelly[i].script.airlockAnim.idle();
    }
    this.finish = true;
    clearInterval(this.motionPickerInterval);
};

AirlockDancers.prototype.update = function(dt) {
    if (this.finish) return;
    this.timer += dt;
};

AirlockDancers.prototype.shuffle = function (array) {
  let currentIndex = array.length,  randomIndex;
    
  // While there remain elements to shuffle...
  while (currentIndex != 0) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
};