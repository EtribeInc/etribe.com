// this script can reference html asset as an attribute
// and will live update dom and reattach events to it on html changes
// so that launcher don't need to be refreshed during development
var HtmlHandler = pc.createScript('htmlHandler');

HtmlHandler.attributes.add('scriptBinder', {type: 'string', title: 'Event Binder Script', default: '#scriptBinder'});

HtmlHandler.attributes.add('pathVariableName', {type: 'string', title:'Variable holding Remote HTML URL'});

HtmlHandler.prototype.initialize = function() {
    var path = new Function("return "+this.pathVariableName)();
    // create DIV element
    this.element = document.createElement('div');
    this.element.classList.add('container');
    this.element.style.overflow = 'hidden';

    this.element.addEventListener('mousedown', function(e) {
        e.stopPropagation();
    });
    this.element.addEventListener('mouseup', function(e) {
        e.stopPropagation();
    });
    this.element.addEventListener('touchstart', function(e) {
        e.stopPropagation();
    });
     this.element.addEventListener('touchend', function(e) {
        e.stopPropagation();
    });
    
    this.scriptBinder = this.entity.script.get(this.scriptBinder);
    // append to body
    // can be appended somewhere else
    // it is recommended to have some container element
    // to prevent iOS problems of overfloating elements off the screen
    document.body.appendChild(this.element);

    // // asset
    // this.asset = null;
    // this.assetId = 0;

    axios({
        method: 'get',
        //url: "https://tcstagelb.cloudbrigade.com/user-api/v1/environment",
        url: path
        // params: {
        //     token: adminToken
        // },
        //responseType: 'json'
    })
    .then(res => {
        this.template(res.data);
    })
    .catch(error => {
        console.log(error);
    });

    this.entity.on("remove", this.remove, this);
};

HtmlHandler.prototype.remove = function() {
    this.element.remove();
};

// HtmlHandler.prototype.attachAsset = function(assetId, fn) {
//     // remember current assetId
//     this.assetId = assetId;

//     // might be no asset provided
//     if (! this.assetId)
//         return fn.call(this);

//     // get asset from registry
//     var asset = this.app.assets.get(this.assetId);

//     // store callback of an asset load event
//     var self = this;
//     asset._onLoad = function(asset) {
//         fn.call(self, asset, asset.resource);
//     };

//     // subscribe to changes on resource
//     asset.on('load', asset._onLoad);
//     // callback
//     fn.call(this, asset, asset.resource);
//     // load asset if not loaded
//     this.app.assets.load(asset);
// };


HtmlHandler.prototype.template = function(html) {
    // // unsubscribe from old asset load event if required
    // if (this.asset && this.asset !== asset)
    //     this.asset.off('load', this.asset._onLoad);

    // // remember current asset
    // this.asset = asset;

    // template element
    // you can use templating languages with renderers here
    // such as hogan, mustache, handlebars or any other
    this.element.innerHTML = html || '';

    // bind some events to dom of an element
    // it has to be done on each retemplate
    if (html && this.scriptBinder){
        console.log("binding events");
        this.scriptBinder.bindEvents(this.element);
    }
};

// HtmlHandler.prototype.update = function (dt) {
//     // check for swapped asset
//     // if so, then start asset loading and templating
//     if (this.assetId !== this.html.id)
//         this.attachAsset(this.html.id, this.template);
// };