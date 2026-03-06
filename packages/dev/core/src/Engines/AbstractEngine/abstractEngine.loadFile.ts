/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import abstractEngine.loadFile.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./abstractEngine.loadFile.pure";

import { AbstractEngine } from "../../Engines/abstractEngine";
import type { IOfflineProvider } from "../../Offline/IOfflineProvider";


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
