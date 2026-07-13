var AirlockAnim = pc.createScript('airlockAnim');

AirlockAnim.prototype.initialize = function () {
    this.upperbodyLayer = this.entity.anim.findAnimationLayer('UpperBody');

    this.app.on('tubeExitHandler:start', () => { this.stopTweens(); }, this);
    this.on('destroy', function () {
        this.app.off(() => { this.stopTweens(); }, this);
    });
};

// AirlockAnim.prototype.update = function(dt) {

// };

AirlockAnim.prototype.wave = function () {
    this.entity.anim.setBoolean("Dance", false);
    this.setWaveLayerState(true);
};

AirlockAnim.prototype.dance = function () {
    this.setWaveLayerState(false);
    this.entity.anim.setBoolean("Dance", true);
};

AirlockAnim.prototype.idle = function () {
    this.entity.anim.setBoolean("Dance", false);
    this.setWaveLayerState(false);
};

AirlockAnim.prototype.setWaveLayerState = function (enable) {
    var val = enable ? 1.0 : 0.0;
    var upperbodyData = { value: this.upperbodyLayer.weight };
    var baseData = { value: this.entity.anim.baseLayer.weight };
    var length = 0.2;

    this.stopTweens();

    this.upperBodyWaveTween = this.app.tween(upperbodyData).to({ value: val }, length);
    this.upperBodyWaveTween.on('update', function (dt) {
        this.upperbodyLayer.weight = upperbodyData.value;
    }, this);
    this.upperBodyWaveTween.start();

    this.baseWaveTween = this.app.tween(baseData).to({ value: 1 - val }, length);
    this.baseWaveTween.on('update', function (dt) {
        this.entity.anim.baseLayer.weight = baseData.value;
    }, this);
    this.baseWaveTween.start();
};

AirlockAnim.prototype.stopTweens = function (enable) {
    if (this.upperBodyWaveTween) this.upperBodyWaveTween.stop();
    if (this.baseWaveTween) this.baseWaveTween.stop();
};
