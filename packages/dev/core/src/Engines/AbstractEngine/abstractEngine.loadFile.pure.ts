/** This file must only contain pure code and pure imports */

import type { IOfflineProvider } from "../../Offline/IOfflineProvider";


declare module "../abstractEngine" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractEngine {
        /**
         * @internal
         */
        _loadFileAsync(url: string, offlineProvider?: IOfflineProvider, useArrayBuffer?: false): Promise<string>;
        _loadFileAsync(url: string, offlineProvider?: IOfflineProvider, useArrayBuffer?: true): Promise<ArrayBuffer>;
        _loadFileAsync(url: string, offlineProvider?: IOfflineProvider, useArrayBuffer?: boolean): Promise<string | ArrayBuffer>;
    }
}
