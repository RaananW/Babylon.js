/** This file must only contain pure code and pure imports */

export * from "./animatable.types";
import { Bone } from "../Bones/bone";
import { AddAnimationExtensions } from "./animatable.core";
import { Scene } from "core/scene";

export * from "./animatable.core";

export {};

let _registered = false;

/**
 * Register side effects for animatable.
 * Safe to call multiple times; only the first call has an effect.
 */
export function registerAnimatable(): void {
    if (_registered) {
        return;
    }
    _registered = true;

    AddAnimationExtensions(Scene, Bone);
}
