export * from "./thinNativeEngine.pure";

import "../Buffers/buffer.align";

declare module "../Materials/effect" {
    /** internal */
    export interface Effect {
        /** internal */
        _checkedNonFloatVertexBuffers?: boolean;
    }
}
