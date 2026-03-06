/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphRichTypes.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphRichTypes.pure";

import { FlowGraphTypes, RichTypeQuaternion } from "./flowGraphRichTypes.pure";
import { Quaternion } from "../Maths/math.vector";

RichTypeQuaternion.typeTransformer = (value: any) => {
    if (value.getClassName) {
        if (value.getClassName() === FlowGraphTypes.Vector4) {
            return Quaternion.FromArray(value.asArray());
        } else if (value.getClassName() === FlowGraphTypes.Vector3) {
            return Quaternion.FromEulerVector(value);
        } else if (value.getClassName() === FlowGraphTypes.Matrix) {
            return Quaternion.FromRotationMatrix(value);
        }
    }
    return value;
};
