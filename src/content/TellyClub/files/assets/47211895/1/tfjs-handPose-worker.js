/*jshint esversion: 9 */
// importScripts("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.6.0/dist/tf.min.js");
// importScripts("https://unpkg.com/@tensorflow-models/handpose");
// importScripts("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@3.6.0/dist/tf-backend-wasm.min.js");
let initialized = false;
let model;

onmessage = function (event) {

    if (!initialized && event.data.setup) {
        importScripts(event.data.setup.tfjs);
        importScripts(event.data.setup.backend);
        importScripts(event.data.setup.model);

        tf.wasm.setWasmPaths({
            'tfjs-backend-wasm.wasm': event.data.setup.wasmPaths.wasm,
            'tfjs-backend-wasm-simd.wasm': event.data.setup.wasmPaths.simd,
            'tfjs-backend-wasm-threaded-simd.wasm': event.data.setup.wasmPaths.threaded
        });

        tf.setBackend('wasm').then(
            async () => {
                model = await handpose.load();
                initialized = true;
                postMessage({
                    "type": "message",
                    "msg": "TFJS worker initialized and model loaded."
                });
                postMessage({
                    "type": "setup",
                    "result": "success"
                });
            }
        );
    } else if (event.data.imgData) {
        const image = new ImageData(event.data.imgData, event.data.width, event.data.height);
        detectHand(
            tf.tidy(() => {
                return tf.browser.fromPixels(image);
            }), event.data.width, event.data.height
        );
    }


    //console.table( tf.memory() );

};

async function detectHand(img) {

    tf.engine().startScope();

    // Pass in a video stream (or an image, canvas, or 3D tensor) to obtain a
    // hand prediction from the MediaPipe graph.
    const predictions = await model.estimateHands(img);
    if (predictions.length > 0 && predictions[0].handInViewConfidence > 0.95) {
        /*
        `predictions` is an array of objects describing each detected hand, for example:
        [
          {
            handInViewConfidence: 1, // The probability of a hand being present.
            boundingBox: { // The bounding box surrounding the hand.
              topLeft: [162.91, -17.42],
              bottomRight: [548.56, 368.23],
            },
            landmarks: [ // The 3D coordinates of each hand landmark.
              [472.52, 298.59, 0.00],
              [412.80, 315.64, -6.18],
              ...
            ],
            annotations: { // Semantic groupings of the `landmarks` coordinates.
              thumb: [
                [412.80, 315.64, -6.18]
                [350.02, 298.38, -7.14],
                ...
              ],
              ...
            }
          }
        ]
        */

        var distances = getDistances(predictions[0].annotations);
        distances = normalizeDistances(distances);

        var handPose = interpretPose(distances);

        postMessage({
            "type": "data",
            "pose": handPose
        });

    } else {
        postMessage({
            "type": "data",
            "pose": null
        });
    }

    tf.engine().endScope();
    img.dispose();

    //setTimeout(detectHand, 1000);

}

function interpretPose(distances) {
    if (distances.index > 0.7 && distances.middle > 0.7) {
        return "wave";
    } else return null;
}

function normalizeDistances(distances) {
    var i;
    var max = 0.0;
    for (const [key, value] of Object.entries(distances)) {
        if (parseFloat(value) > max) {
            max = parseFloat(value);
        }
    }


    for (const [key, value] of Object.entries(distances)) {
        distances[key] = parseFloat(value) / max;
    }
    return distances;
}

function getDistances(fingers) {

    var distances = {
        thumb: 0,
        index: 0,
        middle: 0,
        ring: 0,
        pinky: 0
    };

    var x, y;

    x = fingers.thumb[3][0] - fingers.palmBase[0][0];
    y = fingers.thumb[3][1] - fingers.palmBase[0][1];

    distances.thumb = Math.sqrt(x * x + y * y);

    x = fingers.indexFinger[3][0] - fingers.palmBase[0][0];
    y = fingers.indexFinger[3][1] - fingers.palmBase[0][1];

    distances.index = Math.sqrt(x * x + y * y);

    x = fingers.middleFinger[3][0] - fingers.palmBase[0][0];
    y = fingers.middleFinger[3][1] - fingers.palmBase[0][1];

    distances.middle = Math.sqrt(x * x + y * y);

    x = fingers.ringFinger[3][0] - fingers.palmBase[0][0];
    y = fingers.ringFinger[3][1] - fingers.palmBase[0][1];

    distances.ring = Math.sqrt(x * x + y * y);

    x = fingers.pinky[3][0] - fingers.palmBase[0][0];
    y = fingers.pinky[3][1] - fingers.palmBase[0][1];

    distances.pinky = Math.sqrt(x * x + y * y);

    return distances;
}