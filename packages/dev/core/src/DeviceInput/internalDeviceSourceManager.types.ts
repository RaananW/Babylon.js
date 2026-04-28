import { type InternalDeviceSourceManager } from "./internalDeviceSourceManager.pure"
export {};

declare module "../Engines/abstractEngine" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    interface AbstractEngine {
        /** @internal */
        _deviceSourceManager?: InternalDeviceSourceManager;
    }
}
