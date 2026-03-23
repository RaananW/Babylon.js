import type { SelectionOutlineLayer } from "./selectionOutlineLayer.pure";
import type { Nullable } from "../types";

declare module "../scene" {
    /**
     *
     */
    export interface Scene {
        /**
         * Return a the first selection outline layer of the scene with a given name.
         * @param name The name of the selection outline layer to look for.
         * @returns The selection outline layer if found otherwise null.
         */
        getSelectionOutlineLayerByName(name: string): Nullable<SelectionOutlineLayer>;
    }
}
