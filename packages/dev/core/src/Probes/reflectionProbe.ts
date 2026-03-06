import { ReflectionProbe, ReflectionProbeParse } from "./reflectionProbe.pure";
import { Scene } from "../scene";

declare module "./reflectionProbe.pure" {
    // eslint-disable-next-line @typescript-eslint/no-namespace
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

export * from "./reflectionProbe.pure";
