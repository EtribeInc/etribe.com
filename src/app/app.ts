import { BabylonApp } from './babylon';
import { ModelViewerApp } from './modelviewer';
import WebXRPolyfill from 'webxr-polyfill';
const polyfill = new WebXRPolyfill();

import 'pepjs';

declare global {
    interface Window {
        mlWorld: any;
    }
}

export class App {

    babylonApp: BabylonApp;
    modelviewerApp: ModelViewerApp;

    supportsVR() {
        return Boolean('xr' in navigator ||  'getVRDisplays' in navigator);
    }

    isAndroid() {
        return Boolean(/(android)/i.test(navigator.userAgent) 
                        && !(/(Quest)/.test(navigator.userAgent))
                        && !('xr' in navigator));
    }

    isMagicLeap() {
        return Boolean(window.mlWorld);
    }

    isARQuickLook() {
        const tempAnchor = document.createElement('a');
            return Boolean(
                tempAnchor.relList && tempAnchor.relList.supports &&
                tempAnchor.relList.supports('ar'));
    }

    constructor() {
     
        /** 
        if (!this.isMagicLeap() && !this.isARQuickLook() && !this.isAndroid() && this.supportsVR()) {
            this.babylonApp = new BabylonApp();
        } else {
            this.modelviewerApp = new ModelViewerApp();
        }
        **/
    }
}