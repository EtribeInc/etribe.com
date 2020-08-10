import * as MLPrismatic from '@magicleap/prismatic/';
let mlPrismatic: typeof MLPrismatic;  
if (window.mlWorld) {
    mlPrismatic = require('@magicleap/prismatic/');
}

export class ModelViewerApp {

    modelViewer: HTMLElement;

    constructor() {
        let script = document.createElement('script') as HTMLScriptElement;
        script.src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.js';
        script.type = 'module';
        document.head.append(script);

        this.modelViewer = document.createElement('model-viewer') as HTMLElement;
        this.modelViewer.setAttribute('ar', '');
        this.modelViewer.setAttribute('magic-leap', '');
        this.modelViewer.setAttribute('camera-controls', '');
        this.modelViewer.setAttribute('quick-look-browsers', 'safari chrome');
        this.modelViewer.setAttribute('ios-src', '/assets/3d/Elephant.usdz');
        this.modelViewer.setAttribute('src', '/assets/3d/Elephant.glb');
        this.modelViewer.setAttribute('camera-target', '0m 2m 5m');
        this.modelViewer.setAttribute('camera-orbit', '-90deg 60deg 20m');
        this.modelViewer.setAttribute('interaction-prompt', 'none');
        this.modelViewer.setAttribute('shadow-intensity', '1.5');
        this.modelViewer.setAttribute('shadow-softness', '0.75');
        this.modelViewer.setAttribute('exposure', '0.5');

        const arButton = document.createElement('button') as HTMLElement;
        arButton.id = 'ar-button';
        arButton.setAttribute('slot', 'ar-button');
        this.modelViewer.appendChild(arButton);
        document.body.append(this.modelViewer);

        window.onload =  (): any => {
            if (window.mlWorld) {
                /**
                let mlModel = document.getElementsByTagName('ml-model')[0];
                if (mlModel) {
                    mlModel.setAttribute(
                        'style',
                        'display: block; top: 0; left: 0; width: 80%; height: 80%; transform: translate(-50%, -50%);'
                    );
                    mlModel.setAttribute('z-offset', '-300px');
                }
                **/
            }
        };
    }

}

export default ModelViewerApp;