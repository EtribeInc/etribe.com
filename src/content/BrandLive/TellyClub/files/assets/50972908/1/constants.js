const animLayers = {
    BASE: 0,
    UPPERBODY: 1
};

// --- P2P (Trystero) configuration ---

// Namespace for peer discovery. Never change after launch or live rooms split.
const p2pAppId = 'tellyclub-p2p';

// URL parameter names
const ROOM_PARAM = 'room';
const ENV_PARAM = 'env';

// Optional relay override, e.g. { urls: ['wss://my-relay.example'], redundancy: 3 }
// null = Trystero's default public nostr relays.
const p2pRelayConfig = null;

// TURN fallback for peers behind strict NATs (~10-20% of users).
// Trystero merges these servers with its default STUN servers.
//
// Preferred: fetch short-lived credentials at boot from our coturn auth
// endpoint (p2pBootstrap fetches this before joining). The endpoint returns
// { iceServers: [...] } - the standard RTCPeerConnection shape - so no
// transformation is needed. Set to null to disable and rely on the static
// p2pTurnConfig / STUN-only fallback below.
const p2pTurnCredentialsUrl = 'https://auth.turn.vrketing.de/credentials';

// How long to wait for the credentials fetch before giving up and joining
// with the static fallback below. Keeps a hung auth server from blocking
// room join indefinitely.
const P2P_TURN_FETCH_TIMEOUT_MS = 5000;

// Static TURN fallback, used only if p2pTurnCredentialsUrl is null or the
// fetch fails. Fill in real credentials if you want a hard-coded fallback:
// const p2pTurnConfig = [{
//     urls: ['turn:turn.example.com:443?transport=tcp', 'turn:turn.example.com:3478'],
//     username: 'TURN_USERNAME',
//     credential: 'TURN_CREDENTIAL'
// }];
const p2pTurnConfig = null;

// Custom RTCConfiguration. Set { iceTransportPolicy: 'relay' } to force all
// traffic through TURN when testing the relay path.
const p2pRtcConfig = null;

// --- P2P tuning ---
const P2P_POSE_HZ = 15;          // player position send rate
const P2P_OBJ_HZ = 12;           // networked object send rate (owner)
const P2P_INTERP_MS = 120;       // interpolation buffer delay
const P2P_KEEPALIVE_MS = 1000;   // idle pose keepalive interval
const P2P_OBJ_STALE_MS = 500;    // object buffer staleness cutoff

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