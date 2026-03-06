/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import loadingScreen.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./loadingScreen.pure";

import { AbstractEngine } from "../Engines/abstractEngine";


AbstractEngine.DefaultLoadingScreenFactory = (canvas: HTMLCanvasElement) => {
    return new DefaultLoadingScreen(canvas);
};
