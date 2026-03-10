/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import reflectionProbe.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./reflectionProbe.pure";

import { ReflectionProbe, ReflectionProbeParse } from "./reflectionProbe.pure";
import { Scene } from "../scene";

declare module "../scene" {
    /**
     *
     */
    export interface Scene {
        /**
         * The list of reflection probes added to the scene
         * @see https://doc.babylonjs.com/features/featuresDeepDive/environment/reflectionProbes
         */
        reflectionProbes: Array<ReflectionProbe>;

        /**
         * Removes the given reflection probe from this scene.
         * @param toRemove The reflection probe to remove
         * @returns The index of the removed reflection probe
         */
        removeReflectionProbe(toRemove: ReflectionProbe): number;

        /**
         * Adds the given reflection probe to this scene.
         * @param newReflectionProbe The reflection probe to add
         */
        addReflectionProbe(newReflectionProbe: ReflectionProbe): void;
    }
}

declare module "./reflectionProbe.pure" {
    namespace ReflectionProbe {
        export { ReflectionProbeParse as Parse };
    }
}

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
