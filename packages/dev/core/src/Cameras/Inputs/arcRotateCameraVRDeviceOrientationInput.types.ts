export {};

declare module "../../Cameras/arcRotateCameraInputsManager" {
    /**
     *
     */
    export interface ArcRotateCameraInputsManager {
        /**
         * Add orientation input support to the input manager.
         * @returns the current input manager
         */
        addVRDeviceOrientation(): ArcRotateCameraInputsManager;
    }
}
