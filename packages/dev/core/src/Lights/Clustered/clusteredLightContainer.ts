/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import clusteredLightContainer.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./clusteredLightContainer.pure";

import { RegisterClass } from "core/Misc/typeStore";
import { Node } from "core/node";


Node.AddNodeConstructor("Light_Type_5", (name, scene) => {
    return () => new ClusteredLightContainer(name, [], scene);
});


// Register Class Name
RegisterClass("BABYLON.ClusteredLightContainer", ClusteredLightContainer);
