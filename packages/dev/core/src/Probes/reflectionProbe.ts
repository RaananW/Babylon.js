/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import reflectionProbe.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./reflectionProbe.pure";

import { ReflectionProbe, ReflectionProbeParse } from "./reflectionProbe.pure";
import { Scene } from "../scene";

ReflectionProbe.Parse = ReflectionProbeParse;

Scene.prototype.removeReflectionProbe = function (toRemove: ReflectionProbe): number {
    if (!this.reflectionProbes) {
        return -1;
    }

    const index = this.reflectionProbes.indexOf(toRemove);
    if (index !== -1) {
        this.reflectionProbes.splice(index, 1);
    }

    return index;
};

Scene.prototype.addReflectionProbe = function (newReflectionProbe: ReflectionProbe): void {
    if (!this.reflectionProbes) {
        this.reflectionProbes = [];
    }

    this.reflectionProbes.push(newReflectionProbe);
};
