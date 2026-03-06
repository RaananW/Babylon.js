/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import abstractEngine.dom.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./abstractEngine.dom.pure";

import { IViewportLike } from "../../Maths/math.like";
import { Nullable } from "../../types";
import { AbstractEngine } from "../abstractEngine";

interface IViewportOwnerLike {
    /**
     * Gets or sets the viewport
     */
    viewport: IViewportLike;
}

AbstractEngine.prototype.getInputElement = function (): Nullable<HTMLElement> {
    return this._renderingCanvas;
};

AbstractEngine.prototype.getRenderingCanvasClientRect = function (): Nullable<ClientRect> {
    if (!this._renderingCanvas) {
        return null;
    }
    return this._renderingCanvas.getBoundingClientRect();
};

AbstractEngine.prototype.getInputElementClientRect = function (): Nullable<ClientRect> {
    if (!this._renderingCanvas) {
        return null;
    }
    return this.getInputElement()!.getBoundingClientRect();
};

AbstractEngine.prototype.getAspectRatio = function (viewportOwner: IViewportOwnerLike, useScreen = false): number {
    const viewport = viewportOwner.viewport;
    return (this.getRenderWidth(useScreen) * viewport.width) / (this.getRenderHeight(useScreen) * viewport.height);
};

AbstractEngine.prototype.getScreenAspectRatio = function (): number {
    return this.getRenderWidth(true) / this.getRenderHeight(true);
};

AbstractEngine.prototype._verifyPointerLock = function (): void {
    this._onPointerLockChange?.();
};
