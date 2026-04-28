export * from "./abstractEngine.loadFile.types";

import { type IOfflineProvider } from "../../Offline/IOfflineProvider"
import { AbstractEngine } from "../../Engines/abstractEngine";

let _registered = false;

/**
 * Register side effects for abstractEngine.loadFile.
 * Safe to call multiple times; only the first call has an effect.
 */
export function registerAbstractEngineLoadFile(): void {
    if (_registered) {
        return;
    }
    _registered = true;

    AbstractEngine.prototype._loadFileAsync = async function (url: string, offlineProvider?: IOfflineProvider, useArrayBuffer?: boolean): Promise<any> {
        return await new Promise<string | ArrayBuffer>((resolve, reject) => {
            this._loadFile(
                url,
                (data) => {
                    resolve(data);
                },
                undefined,
                offlineProvider,
                useArrayBuffer,
                (request, exception) => {
                    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                    reject(exception);
                }
            );
        });
    };
}
