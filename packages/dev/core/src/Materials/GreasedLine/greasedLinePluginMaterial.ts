/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import greasedLinePluginMaterial.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./greasedLinePluginMaterial.pure";

import { RegisterClass } from "../../Misc/typeStore";


RegisterClass(`BABYLON.${GreasedLinePluginMaterial.GREASED_LINE_MATERIAL_NAME}`, GreasedLinePluginMaterial);
