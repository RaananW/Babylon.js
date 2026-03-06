/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import imageProcessingConfiguration.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./imageProcessingConfiguration.pure";

import { ImageProcessingConfiguration } from "./imageProcessingConfiguration.pure";
import { SerializationHelper } from "../Misc/decorators.serialization";
import { RegisterClass } from "../Misc/typeStore";

// References the dependencies.
SerializationHelper._ImageProcessingConfigurationParser = ImageProcessingConfiguration.Parse;

// Register Class Name
RegisterClass("BABYLON.ImageProcessingConfiguration", ImageProcessingConfiguration);
