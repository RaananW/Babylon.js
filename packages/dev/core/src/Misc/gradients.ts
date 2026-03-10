import { GradientHelper, GradientHelperGetCurrentGradient } from "./gradients.pure";

declare module "./gradients.pure" {
    namespace GradientHelper {
        export { GradientHelperGetCurrentGradient as GetCurrentGradient };
    }
}

GradientHelper.GetCurrentGradient = GradientHelperGetCurrentGradient;

export * from "./gradients.pure";
