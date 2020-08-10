import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { Vector3, Quaternion, Color4, Color3 } from '@babylonjs/core/Maths/math';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { AdvancedDynamicTexture, StackPanel, TextBlock, Control } from '@babylonjs/gui/2D';

import '@babylonjs/core/Helpers/sceneHelpers';
import '@babylonjs/core/Loading/loadingScreen';
import '@babylonjs/loaders/glTF';
import '@babylonjs/core/Meshes/meshBuilder';
import '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent';

import { WebXRDefaultExperience } from '@babylonjs/core/XR/webXRDefaultExperience';
import { WebXRState } from '@babylonjs/core/XR/webXRTypes';
import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import { WebXRMotionControllerTeleportation } from '@babylonjs/core/XR/features/WebXRControllerTeleportation';
import { WebXRAbstractMotionController } from '@babylonjs/core/XR/motionController/webXRAbstractMotionController';

export class BabylonApp {
    engine: Engine;
    scene: Scene;
    camera: ArcRotateCamera;
    canvas: HTMLCanvasElement;
    uiPlane: Mesh;

    constructor() {

     

        // Get the canvas element from the DOM.
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'babylonCanvas';
        this.canvas.setAttribute('touch-action', 'none');
        document.body.prepend(this.canvas);

        // Associate a Babylon Engine to it.
        this.engine = new Engine(this.canvas);
        this.buildScene();

        window.onresize = (): any => {
            this.engine.resize();
        };

        this.engine.runRenderLoop(() => {
            this.scene.render();
        });


    }

    async buildScene() {

        this.scene = new Scene(this.engine);

        // Camera
        this.camera = new ArcRotateCamera('camera', -Math.PI / 1, Math.PI / 3, 20.0, new Vector3(0, 3, -1), this.scene, true);
        this.camera.speed = 0.1;
        this.camera.attachControl(this.canvas, true);

        // XR Stuff
        const color = new Color4(0.02, 0.63, 0.78, 1.0);
        this.scene.clearColor = color;
        const env = this.scene.createDefaultEnvironment({ enableGroundShadow: true, groundYBias: 1 });
        env.setMainColor(new Color3(color.r + 0.05, color.g - 0.05, color.b + 0.22));
        env.skybox.scaling = new Vector3(3.0, 3.0, 3.0);

        const xrPromise = await this.scene.createDefaultXRExperienceAsync({
            floorMeshes: [env.ground]
        }).then((xr) => {

            this.buildContent();

            xr.baseExperience.onStateChangedObservable.add((state) => {
                if (state === WebXRState.NOT_IN_XR) {
                    console.log('Exited XR.');
                    this.uiPlane.visibility = 0;
                    this.camera.position = new Vector3(-1, 2, -3);
                } else if (state === WebXRState.IN_XR) {
                    console.log('Entered XR!');
                    
                    this.uiPlane.visibility = 1;
                }
            });
        });
    
        
    }

    buildContent() {
        // Directional light
        var light = new DirectionalLight('light1', new Vector3(0, -0.5, 0.75), this.scene);
        light.position = new Vector3(0, 5, -5);

        const shadowGenerator = new ShadowGenerator(1024, light);
        shadowGenerator.useBlurExponentialShadowMap = true;
        shadowGenerator.blurKernel = 32;

        // Logo load
        SceneLoader.ImportMesh('', '/assets/3d/', 'Elephant.glb', this.scene,
        function(meshes, particleSystems, skeletons) {
            var obj = meshes[0];
            obj.position = new Vector3(0, 0.0, 3);
            obj.rotationQuaternion = Quaternion.RotationAxis(new Vector3(0, 1, 0), Math.PI * 2);
            obj.scaling = new Vector3(1.0, 1.0, -1.0); // negative Z to correct
            shadowGenerator.addShadowCaster(obj, true);
        });

        // UI
        this.uiPlane = Mesh.CreatePlane('ui', 6, this.scene);
        this.uiPlane.position = new Vector3(-3, 3, 3);
        this.uiPlane.rotationQuaternion = Quaternion.FromEulerAngles(0.0, 175.0, 0.0);
        const advancedTexture = AdvancedDynamicTexture.CreateForMesh(this.uiPlane);
        const panel = new StackPanel('ui-panel');
        panel.background = 'black';
        panel.alpha = 1;
        advancedTexture.addControl(panel);
        const header = new TextBlock('header-text', 'You Found Jumbo XR!');
        header.paddingTop = 50;
        header.paddingLeft = 50;
        header.height = '150px';
        header.color = 'white';
        header.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        header.fontSize = '90';
        header.fontWeight = '900';
        panel.addControl(header);

        const paragraph = new TextBlock('paragraph-text');
        paragraph.text = 'Welcome to the WebVR version of our site. We will have more fun stuff in here soon.';
        paragraph.paddingTop = 20;
        paragraph.paddingLeft = 50;
        paragraph.paddingRight = 50;
        paragraph.textWrapping = true;
        paragraph.height = '400px';
        paragraph.color = 'white';
        paragraph.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        paragraph.fontSize = '60';
        panel.addControl(paragraph);

        this.uiPlane.visibility = 0;
    }

    enterVR() {
        console.log('VR Entered');
        this.uiPlane.visibility = 1;
    }

    exitVR() {
        console.log('VR Exited');
        this.uiPlane.visibility = 0;
    }
}

export default BabylonApp;