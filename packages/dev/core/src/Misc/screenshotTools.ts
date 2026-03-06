/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import screenshotTools.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./screenshotTools.pure";

import { CreateScreenshot, CreateScreenshotAsync, CreateScreenshotUsingRenderTarget, CreateScreenshotUsingRenderTargetAsync } from "./screenshotTools.pure";
import { Tools } from "./tools";

const initSideEffects = () => {
    // References the dependencies.
    Tools.CreateScreenshot = CreateScreenshot;
    Tools.CreateScreenshotAsync = CreateScreenshotAsync;
    Tools.CreateScreenshotUsingRenderTarget = CreateScreenshotUsingRenderTarget;
    Tools.CreateScreenshotUsingRenderTargetAsync = CreateScreenshotUsingRenderTargetAsync;
};

initSideEffects();
