/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import texture.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./texture.pure";

import { Texture } from "./texture.pure";
import { RegisterClass } from "../../Misc/typeStore";
import { SerializationHelper } from "../../Misc/decorators.serialization";

// References the dependencies.
RegisterClass("BABYLON.Texture", Texture);

SerializationHelper._TextureParser = Texture.Parse;
