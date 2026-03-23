import type { IHeapNode, IHeapSnapshot, IScenario } from "@memlab/core";

/**
 * Tuning options for the Babylon-specific memlab leak filter.
 */
export interface LeakFilterOptions {
    /** Minimum retained size that should be considered interesting. */
    minRetainedSize?: number;
    /** Exact node names to ignore. */
    ignoredNames?: string[];
    /** Name fragments that identify framework/system nodes to ignore. */
    ignoredNameFragments?: string[];
    /** Heap node types to ignore. */
    ignoredTypes?: string[];
    /** Edge types to ignore. */
    ignoredEdgeTypes?: string[];
}

const defaultIgnoredNames = ["FontAwesomeConfig", "WebGL2RenderingContext"];
const defaultIgnoredNameFragments = ["system "];
const defaultIgnoredTypes = ["hidden"];
const defaultIgnoredEdgeTypes = ["internal", "hidden", "weak"];

/**
 * Creates the default Babylon-specific memlab leak filter.
 * @param options Optional filter overrides.
 * @returns A memlab leak filter callback.
 */
export function createBabylonLeakFilter(options: LeakFilterOptions = {}): NonNullable<IScenario["leakFilter"]> {
    const minRetainedSize = options.minRetainedSize ?? 40000;
    const ignoredNames = new Set(options.ignoredNames ?? defaultIgnoredNames);
    const ignoredNameFragments = options.ignoredNameFragments ?? defaultIgnoredNameFragments;
    const ignoredTypes = new Set(options.ignoredTypes ?? defaultIgnoredTypes);
    const ignoredEdgeTypes = new Set(options.ignoredEdgeTypes ?? defaultIgnoredEdgeTypes);

    return (node: IHeapNode, _snapshot: IHeapSnapshot, _leakedNodeIds: Set<number>) => {
        if (node.retainedSize < minRetainedSize) {
            return false;
        }

        if (node.pathEdge?.type && ignoredEdgeTypes.has(node.pathEdge.type)) {
            return false;
        }

        if (ignoredTypes.has(node.type)) {
            return false;
        }

        if (node.name && ignoredNames.has(node.name)) {
            return false;
        }

        if ((!node.name && node.type === "object") || node.name === "Object") {
            return false;
        }

        if (node.name && ignoredNameFragments.some((fragment) => node.name.includes(fragment))) {
            return false;
        }

        if (node.type.includes("system ")) {
            return false;
        }

        return true;
    };
}
