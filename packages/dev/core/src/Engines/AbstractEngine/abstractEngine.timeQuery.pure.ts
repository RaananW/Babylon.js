/** This file must only contain pure code and pure imports */

import type { Nullable } from "../../types";


declare module "../../Engines/abstractEngine" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractEngine {
        /** @internal */
        _gpuFrameTime: Nullable<PerfCounter>;
        /**
         * Get the performance counter associated with the frame time computation
         * @returns the perf counter
         */
        getGPUFrameTimeCounter(): PerfCounter;
        /**
         * Enable or disable the GPU frame time capture
         * @param value True to enable, false to disable
         */
        captureGPUFrameTime(value: boolean): void;
    }
}
