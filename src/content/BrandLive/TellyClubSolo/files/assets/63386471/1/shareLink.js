var ShareLink = pc.createScript('shareLink');

ShareLink.attributes.add('baseLink', {
    title: 'Base Link',
    description: 'Base link to share.',
    type: 'string',
    default: 'https://tellyclub.com/join-room'
});

// initialize code called once per entity
ShareLink.prototype.initialize = function() {
    this.entity.element.text = this.baseLink + "?server="+getURLParameter("server")+"&port="+getURLParameter("port");

    this.entity.on("copyLink", this.copyLink, this);
};



// update code called every frame
ShareLink.prototype.copyLink = function() {
    navigator.clipboard.writeText(this.entity.element.text).then(function() {
        console.log('Async: Copying Link to clipboard was successful!');
    }, function(err) {
        console.error('Async: Could not copy text: ', err);
    });
};

// swap method called for script hot-reloading
// inherit your script state here
// ShareLink.prototype.swap = function(old) { };

// to learn more about script anatomy, please read:
// https://developer.playcanvas.com/en/user-manual/scripting/