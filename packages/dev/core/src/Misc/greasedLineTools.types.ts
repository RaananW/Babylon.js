export {};

declare module "./greasedLineTools.pure" {
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
