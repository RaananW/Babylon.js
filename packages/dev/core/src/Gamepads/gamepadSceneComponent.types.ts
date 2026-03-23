import type { GamepadManager } from "./gamepadManager";
import type { Nullable } from "../types";

declare module "../scene" {
    /**
     *
     */
    export interface Scene {
        /** @internal */
        _gamepadManager: Nullable<GamepadManager>;

        /**
         * Gets the gamepad manager associated with the scene
         * @see https://doc.babylonjs.com/features/featuresDeepDive/input/gamepads
         */
        gamepadManager: GamepadManager;
    }
}

declare module "../Cameras/freeCameraInputsManager" {
    /**
     * Interface representing a free camera inputs manager
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface FreeCameraInputsManager {
        /**
         * Adds gamepad input support to the FreeCameraInputsManager.
         * @returns the FreeCameraInputsManager
         */
        addGamepad(): FreeCameraInputsManager;
    }
}

declare module "../Cameras/arcRotateCameraInputsManager" {
    /**
     * Interface representing an arc rotate camera inputs manager
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface ArcRotateCameraInputsManager {
        /**
         * Adds gamepad input support to the ArcRotateCamera InputManager.
         * @returns the camera inputs manager
         */
        addGamepad(): ArcRotateCameraInputsManager;
    }
}
