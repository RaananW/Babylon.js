/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import cubeTexture.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./cubeTexture.pure";

import { CubeTexture } from "./cubeTexture.pure";
import { Texture } from "../../Materials/Textures/texture";
import { RegisterClass } from "../../Misc/typeStore";

Texture._CubeTextureParser = CubeTexture.Parse;

// Some exporters relies on Tools.Instantiate
RegisterClass("BABYLON.CubeTexture", CubeTexture);
