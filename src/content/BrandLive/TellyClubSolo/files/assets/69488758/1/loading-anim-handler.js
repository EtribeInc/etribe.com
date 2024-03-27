var LoadingAnimHandler = pc.createScript('loadingAnimHandler');


LoadingAnimHandler.attributes.add('css', { type: 'asset', assetType: 'css', title: 'CSS Asset' });
LoadingAnimHandler.attributes.add('html', { type: 'asset', assetType: 'html', title: 'HTML Asset' });

LoadingAnimHandler.attributes.add('showEvent', { type: 'string', title: 'Show Event' });

// initialize code called once per entity
LoadingAnimHandler.prototype.initialize = function () {
    // create STYLE element
    this.style = document.createElement('style');

    // append to head
    document.head.appendChild(this.style);
    this.style.innerHTML = this.css.resource || '';

    // Add the HTML
    this.element = document.createElement('div');
    this.element.classList.add('container');
    this.element.innerHTML = this.html.resource || '';

    // append to body
    // can be appended somewhere else
    // it is recommended to have some container element
    // to prevent iOS problems of overfloating elements off the screen
    if (this.showEvent != "")
        this.app.on(this.showEvent, () => {
            document.body.appendChild(this.element);
        }, this);
    else
        document.body.appendChild(this.element);


    //Uncomment for direct css/display testing
    //document.body.appendChild(this.element);

    this.entity.on("destroy", this.remove, this);
};

// update code called every frame
LoadingAnimHandler.prototype.update = function (dt) {

};

LoadingAnimHandler.prototype.remove = function () {
    this.element.remove();
    this.style.remove();
};
// swap method called for script hot-reloading
// inherit your script state here
// LoadingAnimHandler.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// http://developer.playcanvas.com/en/user-manual/scripting/