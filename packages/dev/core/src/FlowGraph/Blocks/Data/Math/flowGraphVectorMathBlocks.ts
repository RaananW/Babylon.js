/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import flowGraphVectorMathBlocks.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./flowGraphVectorMathBlocks.pure";

import {
    FlowGraphAngleBetweenBlock,
    FlowGraphAxisAngleFromQuaternionBlock,
    FlowGraphConjugateBlock,
    FlowGraphCrossBlock,
    FlowGraphDotBlock,
    FlowGraphLengthBlock,
    FlowGraphNormalizeBlock,
    FlowGraphQuaternionFromAxisAngleBlock,
    FlowGraphRotate2DBlock,
    FlowGraphRotate3DBlock,
    FlowGraphTransformBlock,
    FlowGraphTransformCoordinatesBlock,
} from "./flowGraphVectorMathBlocks.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { RegisterClass } from "core/Misc/typeStore";

RegisterClass(FlowGraphBlockNames.Length, FlowGraphLengthBlock);

RegisterClass(FlowGraphBlockNames.Normalize, FlowGraphNormalizeBlock);

RegisterClass(FlowGraphBlockNames.Dot, FlowGraphDotBlock);

RegisterClass(FlowGraphBlockNames.Cross, FlowGraphCrossBlock);

RegisterClass(FlowGraphBlockNames.Rotate2D, FlowGraphRotate2DBlock);

RegisterClass(FlowGraphBlockNames.Rotate3D, FlowGraphRotate3DBlock);

RegisterClass(FlowGraphBlockNames.TransformVector, FlowGraphTransformBlock);

RegisterClass(FlowGraphBlockNames.TransformCoordinates, FlowGraphTransformCoordinatesBlock);

RegisterClass(FlowGraphBlockNames.Conjugate, FlowGraphConjugateBlock);

RegisterClass(FlowGraphBlockNames.AngleBetween, FlowGraphAngleBetweenBlock);

RegisterClass(FlowGraphBlockNames.QuaternionFromAxisAngle, FlowGraphQuaternionFromAxisAngleBlock);

RegisterClass(FlowGraphBlockNames.AxisAngleFromQuaternion, FlowGraphAxisAngleFromQuaternionBlock);
