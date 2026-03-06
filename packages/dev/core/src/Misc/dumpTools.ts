/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import dumpTools.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./dumpTools.pure";

import { DumpData, DumpDataAsync, DumpFramebuffer } from "./dumpTools.pure";
import { Tools } from "./tools";

const InitSideEffects = () => {
    // References the dependencies.
    Tools.DumpData = DumpData;
    Tools.DumpDataAsync = DumpDataAsync;
    Tools.DumpFramebuffer = DumpFramebuffer;
};


InitSideEffects();
