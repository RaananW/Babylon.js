export * from "./greasedLineTools.pure";
import { GreasedLineTools } from "./greasedLineTools.pure";
import {
    GreasedLineToolsConvertPoints,
    GreasedLineToolsOmitZeroLengthPredicate,
    GreasedLineToolsMeshesToLines,
    GreasedLineToolsToVector3Array,
    GreasedLineToolsToNumberArray,
    GreasedLineToolsGetPointsCountInfo,
    GreasedLineToolsGetLineLength,
    GreasedLineToolsGetLineLengthArray,
    GreasedLineToolsSegmentizeSegmentByCount,
    GreasedLineToolsSegmentizeLineBySegmentLength,
    GreasedLineToolsSegmentizeLineBySegmentCount,
    GreasedLineToolsGetLineSegments,
    GreasedLineToolsGetMinMaxSegmentLength,
    GreasedLineToolsGetPositionOnLineByVisibility,
    GreasedLineToolsGetCircleLinePoints,
    GreasedLineToolsGetBezierLinePoints,
    GreasedLineToolsGetArrowCap,
    GreasedLineToolsGetPointsFromText,
    GreasedLineToolsColor3toRGBAUint8,
    GreasedLineToolsCreateColorsTexture,
    GreasedLineToolsPrepareEmptyColorsTexture,
    GreasedLineToolsDisposeEmptyColorsTexture,
    GreasedLineToolsBooleanToNumber,
} from "./greasedLineTools.pure";

declare module "./greasedLineTools.pure" {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace GreasedLineTools {
        export let ConvertPoints: typeof GreasedLineToolsConvertPoints;
        export let OmitZeroLengthPredicate: typeof GreasedLineToolsOmitZeroLengthPredicate;
        export let MeshesToLines: typeof GreasedLineToolsMeshesToLines;
        export let ToVector3Array: typeof GreasedLineToolsToVector3Array;
        export let ToNumberArray: typeof GreasedLineToolsToNumberArray;
        export let GetPointsCountInfo: typeof GreasedLineToolsGetPointsCountInfo;
        export let GetLineLength: typeof GreasedLineToolsGetLineLength;
        export let GetLineLengthArray: typeof GreasedLineToolsGetLineLengthArray;
        export let SegmentizeSegmentByCount: typeof GreasedLineToolsSegmentizeSegmentByCount;
        export let SegmentizeLineBySegmentLength: typeof GreasedLineToolsSegmentizeLineBySegmentLength;
        export let SegmentizeLineBySegmentCount: typeof GreasedLineToolsSegmentizeLineBySegmentCount;
        export let GetLineSegments: typeof GreasedLineToolsGetLineSegments;
        export let GetMinMaxSegmentLength: typeof GreasedLineToolsGetMinMaxSegmentLength;
        export let GetPositionOnLineByVisibility: typeof GreasedLineToolsGetPositionOnLineByVisibility;
        export let GetCircleLinePoints: typeof GreasedLineToolsGetCircleLinePoints;
        export let GetBezierLinePoints: typeof GreasedLineToolsGetBezierLinePoints;
        export let GetArrowCap: typeof GreasedLineToolsGetArrowCap;
        export let GetPointsFromText: typeof GreasedLineToolsGetPointsFromText;
        export let Color3toRGBAUint8: typeof GreasedLineToolsColor3toRGBAUint8;
        export let CreateColorsTexture: typeof GreasedLineToolsCreateColorsTexture;
        export let PrepareEmptyColorsTexture: typeof GreasedLineToolsPrepareEmptyColorsTexture;
        export let DisposeEmptyColorsTexture: typeof GreasedLineToolsDisposeEmptyColorsTexture;
        export let BooleanToNumber: typeof GreasedLineToolsBooleanToNumber;
    }
}

GreasedLineTools.ConvertPoints = GreasedLineToolsConvertPoints;
GreasedLineTools.OmitZeroLengthPredicate = GreasedLineToolsOmitZeroLengthPredicate;
GreasedLineTools.MeshesToLines = GreasedLineToolsMeshesToLines;
GreasedLineTools.ToVector3Array = GreasedLineToolsToVector3Array;
GreasedLineTools.ToNumberArray = GreasedLineToolsToNumberArray;
GreasedLineTools.GetPointsCountInfo = GreasedLineToolsGetPointsCountInfo;
GreasedLineTools.GetLineLength = GreasedLineToolsGetLineLength;
GreasedLineTools.GetLineLengthArray = GreasedLineToolsGetLineLengthArray;
GreasedLineTools.SegmentizeSegmentByCount = GreasedLineToolsSegmentizeSegmentByCount;
GreasedLineTools.SegmentizeLineBySegmentLength = GreasedLineToolsSegmentizeLineBySegmentLength;
GreasedLineTools.SegmentizeLineBySegmentCount = GreasedLineToolsSegmentizeLineBySegmentCount;
GreasedLineTools.GetLineSegments = GreasedLineToolsGetLineSegments;
GreasedLineTools.GetMinMaxSegmentLength = GreasedLineToolsGetMinMaxSegmentLength;
GreasedLineTools.GetPositionOnLineByVisibility = GreasedLineToolsGetPositionOnLineByVisibility;
GreasedLineTools.GetCircleLinePoints = GreasedLineToolsGetCircleLinePoints;
GreasedLineTools.GetBezierLinePoints = GreasedLineToolsGetBezierLinePoints;
GreasedLineTools.GetArrowCap = GreasedLineToolsGetArrowCap;
GreasedLineTools.GetPointsFromText = GreasedLineToolsGetPointsFromText;
GreasedLineTools.Color3toRGBAUint8 = GreasedLineToolsColor3toRGBAUint8;
GreasedLineTools.CreateColorsTexture = GreasedLineToolsCreateColorsTexture;
GreasedLineTools.PrepareEmptyColorsTexture = GreasedLineToolsPrepareEmptyColorsTexture;
GreasedLineTools.DisposeEmptyColorsTexture = GreasedLineToolsDisposeEmptyColorsTexture;
GreasedLineTools.BooleanToNumber = GreasedLineToolsBooleanToNumber;
