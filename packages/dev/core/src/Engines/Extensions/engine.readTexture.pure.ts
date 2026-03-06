/** This file must only contain pure code and pure imports */

import type { InternalTexture } from "../../Materials/Textures/internalTexture";
import type { Nullable } from "../../types";
import { allocateAndCopyTypedBuffer } from "../../Engines/abstractEngine.functions";


declare module "../../Engines/abstractEngine" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractEngine {
        /** @internal */
        _readTexturePixels(
            texture: InternalTexture,
            width: number,
            height: number,
            faceIndex?: number,
            level?: number,
            buffer?: Nullable<ArrayBufferView>,
            flushRenderer?: boolean,
            noDataConversion?: boolean,
            x?: number,
            y?: number
        ): Promise<ArrayBufferView>;

        /** @internal */
        _readTexturePixelsSync(
            texture: InternalTexture,
            width: number,
            height: number,
            faceIndex?: number,
            level?: number,
            buffer?: Nullable<ArrayBufferView>,
            flushRenderer?: boolean,
            noDataConversion?: boolean,
            x?: number,
            y?: number
        ): ArrayBufferView;
    }
}

// back-compat
export { allocateAndCopyTypedBuffer };
