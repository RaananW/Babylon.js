import { DeepCopier, DeepCopierDeepCopy } from "./deepCopier.pure";

declare module "./deepCopier.pure" {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace DeepCopier {
        export { DeepCopierDeepCopy as DeepCopy };
    }
}

DeepCopier.DeepCopy = DeepCopierDeepCopy;

export * from "./deepCopier.pure";
