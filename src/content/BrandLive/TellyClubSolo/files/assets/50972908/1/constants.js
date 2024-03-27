const animLayers = {
    BASE: 0,
    UPPERBODY: 1
};

const stagingServer = "https://staging-us-west-2.tellyclub.com";
const stagingPort = "1935";

const baselayerAnimStates = {
    IDLE: 0,
    WALK: 1,
    WALKBACK: 2,
    TURNLEFT: 3,
    TURNRIGHT: 4,
    DANCE: 5,
    EXIT: 6
};

const upperbodyAnimStates = {
    WAVESTART: 0,
    WAVESTOP: 1
};

const emotes = {
    WAVE: 0,
    DANCE: 1
};

function getURLParameter(name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
}

function setURLParameter(name, value) {
    let params = new URLSearchParams(window.location.search);
    params.set(name, value);
    const nextURL = '?' + params.toString();
    const nextTitle = 'Tellyclub';
    const nextState = { additionalInformation: 'changed ' + name + ' to ' + value };

    // This will create a new entry in the browser's history, without reloading
    window.history.replaceState(nextState, null, nextURL);
}

function removeURLParameter(name) {
    let params = new URLSearchParams(window.location.search);
    // Delete the parameter.
    params.delete(name);
    const nextURL = '?' + params.toString();
    const nextTitle = 'Tellyclub';
    const nextState = { additionalInformation: 'removed parameter ' + name };

    // This will create a new entry in the browser's history, without reloading
    window.history.replaceState(nextState, null, nextURL);
}