import { DeepCopier, DeepCopierDeepCopy } from "./deepCopier.pure";

declare module "./deepCopier.pure" {
    namespace DeepCopier {
        export { DeepCopierDeepCopy as DeepCopy };
    }
}

DeepCopier.DeepCopy = DeepCopierDeepCopy;

export * from "./deepCopier.pure";
