/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import fresnelParameters.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./fresnelParameters.pure";

import { FresnelParameters } from "./fresnelParameters.pure";
import { SerializationHelper } from "../Misc/decorators.serialization";

// References the dependencies.
SerializationHelper._FresnelParametersParser = FresnelParameters.Parse;
