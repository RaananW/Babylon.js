import { GradientHelper, GradientHelperGetCurrentGradient } from "./gradients.pure";

declare module "./gradients.pure" {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace GradientHelper {
        export { GradientHelperGetCurrentGradient as GetCurrentGradient };
    }
}

GradientHelper.GetCurrentGradient = GradientHelperGetCurrentGradient;

export * from "./gradients.pure";
