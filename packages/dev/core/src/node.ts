import { Node, NodeParseAnimationRanges } from "./node.pure";

declare module "./node.pure" {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Node {
        export { NodeParseAnimationRanges as ParseAnimationRanges };
    }
}

Node.ParseAnimationRanges = NodeParseAnimationRanges;

export * from "./node.pure";
