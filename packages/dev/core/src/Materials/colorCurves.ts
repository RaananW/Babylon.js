/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import colorCurves.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./colorCurves.pure";

import { ColorCurves } from "./colorCurves.pure";
import { SerializationHelper } from "../Misc/decorators.serialization";

// References the dependencies.
SerializationHelper._ColorCurvesParser = ColorCurves.Parse;
