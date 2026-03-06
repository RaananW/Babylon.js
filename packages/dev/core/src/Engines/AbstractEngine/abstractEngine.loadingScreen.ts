/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import abstractEngine.loadingScreen.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./abstractEngine.loadingScreen.pure";

import { ILoadingScreen } from "../../Loading/loadingScreen";
import { IsWindowObjectExist } from "../../Misc/domManagement";
import { AbstractEngine } from "../abstractEngine";

AbstractEngine.prototype.displayLoadingUI = function (): void {
    if (!IsWindowObjectExist()) {
        return;
    }
    const loadingScreen = this.loadingScreen;
    if (loadingScreen) {
        loadingScreen.displayLoadingUI();
    }
};

AbstractEngine.prototype.hideLoadingUI = function (): void {
    if (!IsWindowObjectExist()) {
        return;
    }
    const loadingScreen = this._loadingScreen;
    if (loadingScreen) {
        loadingScreen.hideLoadingUI();
    }
};

Object.defineProperty(AbstractEngine.prototype, "loadingScreen", {
    get: function (this: AbstractEngine) {
        if (!this._loadingScreen && this._renderingCanvas) {
            this._loadingScreen = AbstractEngine.DefaultLoadingScreenFactory(this._renderingCanvas);
        }
        return this._loadingScreen;
    },
    set: function (this: AbstractEngine, value: ILoadingScreen) {
        this._loadingScreen = value;
    },
    enumerable: true,
    configurable: true,
});

Object.defineProperty(AbstractEngine.prototype, "loadingUIText", {
    set: function (this: AbstractEngine, value: string) {
        this.loadingScreen.loadingUIText = value;
    },
    enumerable: true,
    configurable: true,
});

Object.defineProperty(AbstractEngine.prototype, "loadingUIBackgroundColor", {
    set: function (this: AbstractEngine, value: string) {
        this.loadingScreen.loadingUIBackgroundColor = value;
    },
    enumerable: true,
    configurable: true,
});
