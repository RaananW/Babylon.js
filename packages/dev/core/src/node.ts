import { Node, NodeParseAnimationRanges } from "./node.pure";

declare module "./node.pure" {
    namespace Node {
        export { NodeParseAnimationRanges as ParseAnimationRanges };
    }
}

Node.ParseAnimationRanges = NodeParseAnimationRanges;

export * from "./node.pure";
