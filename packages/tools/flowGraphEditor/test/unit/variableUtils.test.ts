import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { type Engine, NullEngine } from "core/Engines";
import { type FlowGraph, type FlowGraphContext, FlowGraphCoordinator, FlowGraphGetVariableBlock } from "core/FlowGraph";
import { FlowGraphSetVariableBlock } from "core/FlowGraph/Blocks/Execution/flowGraphSetVariableBlock";
import { Scene } from "core/scene";
import { gatherVariables, gatherVariableNames, renameVariable, deleteVariable, formatVariableValue, filterSuggestions, type IVariableEntry } from "flow-graph-editor/variableUtils";
import { CONSTRUCTOR_CONFIG } from "flow-graph-editor/graphSystem/properties/constructorConfigRegistry";

describe("Flow Graph Variable Utils", () => {
    let engine: Engine;
    let scene: Scene;
    let flowGraphCoordinator: FlowGraphCoordinator;
    let flowGraph: FlowGraph;
    let flowGraphContext: FlowGraphContext;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });

        scene = new Scene(engine);
        flowGraphCoordinator = new FlowGraphCoordinator({ scene });
        flowGraph = flowGraphCoordinator.createGraph();
        flowGraphContext = flowGraph.createContext();
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    // --------------------------------------------------------
    // gatherVariables
    // --------------------------------------------------------
    describe("gatherVariables", () => {
        it("returns empty array for a graph with no variable blocks", () => {
            const result = gatherVariables(flowGraph);
            expect(result).toEqual([]);
        });

        it("finds a single GetVariable block", () => {
            const get = new FlowGraphGetVariableBlock({ variable: "myVar" });
            flowGraph.addBlock(get);

            const result = gatherVariables(flowGraph);
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({ name: "myVar", getCount: 1, setCount: 0 });
        });

        it("finds a single SetVariable block", () => {
            const set = new FlowGraphSetVariableBlock({ variable: "myVar" });
            flowGraph.addBlock(set);

            const result = gatherVariables(flowGraph);
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({ name: "myVar", getCount: 0, setCount: 1 });
        });

        it("counts multiple GetVariable blocks for the same variable", () => {
            flowGraph.addBlock(new FlowGraphGetVariableBlock({ variable: "x" }));
            flowGraph.addBlock(new FlowGraphGetVariableBlock({ variable: "x" }));

            const result = gatherVariables(flowGraph);
            expect(result).toHaveLength(1);
            expect(result[0].getCount).toBe(2);
            expect(result[0].setCount).toBe(0);
        });

        it("aggregates Get and Set counts for the same variable", () => {
            flowGraph.addBlock(new FlowGraphGetVariableBlock({ variable: "counter" }));
            flowGraph.addBlock(new FlowGraphGetVariableBlock({ variable: "counter" }));
            flowGraph.addBlock(new FlowGraphSetVariableBlock({ variable: "counter" }));

            const result = gatherVariables(flowGraph);
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({ name: "counter", getCount: 2, setCount: 1 });
        });

        it("handles SetVariable in multi-variable mode", () => {
            const set = new FlowGraphSetVariableBlock({ variables: ["a", "b", "c"] });
            flowGraph.addBlock(set);

            const result = gatherVariables(flowGraph);
            const names = result.map((v) => v.name);
            expect(names).toContain("a");
            expect(names).toContain("b");
            expect(names).toContain("c");
            for (const entry of result) {
                expect(entry.setCount).toBe(1);
            }
        });

        it("includes context user variables not referenced by blocks", () => {
            flowGraphContext.setVariable("orphanVar", 42);

            const result = gatherVariables(flowGraph);
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({ name: "orphanVar", getCount: 0, setCount: 0 });
        });

        it("merges block-referenced and context-only variables", () => {
            flowGraph.addBlock(new FlowGraphGetVariableBlock({ variable: "fromBlock" }));
            flowGraphContext.setVariable("fromContext", "hello");

            const result = gatherVariables(flowGraph);
            expect(result).toHaveLength(2);
            const names = result.map((v) => v.name);
            expect(names).toContain("fromBlock");
            expect(names).toContain("fromContext");
        });

        it("returns variables sorted alphabetically", () => {
            flowGraph.addBlock(new FlowGraphGetVariableBlock({ variable: "zebra" }));
            flowGraph.addBlock(new FlowGraphGetVariableBlock({ variable: "apple" }));
            flowGraph.addBlock(new FlowGraphGetVariableBlock({ variable: "mango" }));

            const result = gatherVariables(flowGraph);
            expect(result.map((v) => v.name)).toEqual(["apple", "mango", "zebra"]);
        });

        it("does not double-count a variable that exists in both blocks and context", () => {
            flowGraph.addBlock(new FlowGraphGetVariableBlock({ variable: "shared" }));
            flowGraphContext.setVariable("shared", 10);

            const result = gatherVariables(flowGraph);
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({ name: "shared", getCount: 1, setCount: 0 });
        });
    });

    // --------------------------------------------------------
    // gatherVariableNames
    // --------------------------------------------------------
    describe("gatherVariableNames", () => {
        it("returns empty array for graph with no variable blocks", () => {
            expect(gatherVariableNames(flowGraph)).toEqual([]);
        });

        it("returns sorted unique variable names", () => {
            flowGraph.addBlock(new FlowGraphGetVariableBlock({ variable: "b" }));
            flowGraph.addBlock(new FlowGraphSetVariableBlock({ variable: "a" }));
            flowGraph.addBlock(new FlowGraphGetVariableBlock({ variable: "b" }));

            expect(gatherVariableNames(flowGraph)).toEqual(["a", "b"]);
        });

        it("excludes variables from the excluded block", () => {
            const excluded = new FlowGraphGetVariableBlock({ variable: "private" });
            flowGraph.addBlock(excluded);
            flowGraph.addBlock(new FlowGraphGetVariableBlock({ variable: "shared" }));

            const result = gatherVariableNames(flowGraph, excluded);
            expect(result).toEqual(["shared"]);
        });

        it("includes context user variables", () => {
            flowGraphContext.setVariable("contextVar", true);

            const result = gatherVariableNames(flowGraph);
            expect(result).toEqual(["contextVar"]);
        });
    });

    // --------------------------------------------------------
    // renameVariable
    // --------------------------------------------------------
    describe("renameVariable", () => {
        it("renames a GetVariable block's config", () => {
            const get = new FlowGraphGetVariableBlock({ variable: "old" });
            flowGraph.addBlock(get);

            renameVariable(flowGraph, "old", "new");
            expect((get.config as any).variable).toBe("new");
        });

        it("renames a SetVariable block's config", () => {
            const set = new FlowGraphSetVariableBlock({ variable: "old" });
            flowGraph.addBlock(set);

            renameVariable(flowGraph, "old", "new");
            expect((set.config as any).variable).toBe("new");
        });

        it("renames in SetVariable multi-variable mode", () => {
            const set = new FlowGraphSetVariableBlock({ variables: ["alpha", "old", "gamma"] });
            flowGraph.addBlock(set);

            renameVariable(flowGraph, "old", "new");
            expect((set.config as any).variables).toEqual(["alpha", "new", "gamma"]);
        });

        it("renames in context user variables", () => {
            flowGraphContext.setVariable("old", 123);

            renameVariable(flowGraph, "old", "new");
            expect(flowGraphContext.hasVariable("old")).toBe(false);
            expect(flowGraphContext.hasVariable("new")).toBe(true);
            expect(flowGraphContext.getVariable("new")).toBe(123);
        });

        it("does nothing when old and new names are the same", () => {
            const get = new FlowGraphGetVariableBlock({ variable: "same" });
            flowGraph.addBlock(get);

            renameVariable(flowGraph, "same", "same");
            expect((get.config as any).variable).toBe("same");
        });

        it("does nothing when new name is empty", () => {
            const get = new FlowGraphGetVariableBlock({ variable: "existing" });
            flowGraph.addBlock(get);

            renameVariable(flowGraph, "existing", "");
            expect((get.config as any).variable).toBe("existing");
        });

        it("only renames matching variables, leaves others untouched", () => {
            const get1 = new FlowGraphGetVariableBlock({ variable: "target" });
            const get2 = new FlowGraphGetVariableBlock({ variable: "other" });
            flowGraph.addBlock(get1);
            flowGraph.addBlock(get2);

            renameVariable(flowGraph, "target", "renamed");
            expect((get1.config as any).variable).toBe("renamed");
            expect((get2.config as any).variable).toBe("other");
        });
    });

    // --------------------------------------------------------
    // deleteVariable
    // --------------------------------------------------------
    describe("deleteVariable", () => {
        it("removes a GetVariable block referencing the deleted variable", () => {
            const get = new FlowGraphGetVariableBlock({ variable: "toDelete" });
            flowGraph.addBlock(get);

            deleteVariable(flowGraph, "toDelete");
            expect(flowGraph.getAllBlocks()).toHaveLength(0);
        });

        it("removes a SetVariable block referencing the deleted variable", () => {
            const set = new FlowGraphSetVariableBlock({ variable: "toDelete" });
            flowGraph.addBlock(set);

            deleteVariable(flowGraph, "toDelete");
            expect(flowGraph.getAllBlocks()).toHaveLength(0);
        });

        it("removes variable from multi-variable SetVariable without removing block", () => {
            const set = new FlowGraphSetVariableBlock({ variables: ["keep", "toDelete"] });
            flowGraph.addBlock(set);

            deleteVariable(flowGraph, "toDelete");
            expect(flowGraph.getAllBlocks()).toHaveLength(1);
            expect((set.config as any).variables).toEqual(["keep"]);
        });

        it("removes multi-variable SetVariable block when last variable is deleted", () => {
            const set = new FlowGraphSetVariableBlock({ variables: ["only"] });
            flowGraph.addBlock(set);

            deleteVariable(flowGraph, "only");
            expect(flowGraph.getAllBlocks()).toHaveLength(0);
        });

        it("removes variable from context", () => {
            flowGraphContext.setVariable("toDelete", "value");

            deleteVariable(flowGraph, "toDelete");
            expect(flowGraphContext.hasVariable("toDelete")).toBe(false);
        });

        it("does not affect unrelated blocks or variables", () => {
            const keep = new FlowGraphGetVariableBlock({ variable: "keep" });
            const del = new FlowGraphGetVariableBlock({ variable: "del" });
            flowGraph.addBlock(keep);
            flowGraph.addBlock(del);
            flowGraphContext.setVariable("keep", 1);
            flowGraphContext.setVariable("del", 2);

            deleteVariable(flowGraph, "del");
            expect(flowGraph.getAllBlocks()).toHaveLength(1);
            expect((flowGraph.getAllBlocks()[0].config as any).variable).toBe("keep");
            expect(flowGraphContext.hasVariable("keep")).toBe(true);
        });
    });

    // --------------------------------------------------------
    // formatVariableValue
    // --------------------------------------------------------
    describe("formatVariableValue", () => {
        it("formats undefined", () => {
            expect(formatVariableValue(undefined)).toBe("undefined");
        });

        it("formats null", () => {
            expect(formatVariableValue(null)).toBe("null");
        });

        it("formats numbers", () => {
            expect(formatVariableValue(42)).toBe("42");
            expect(formatVariableValue(3.14)).toBe("3.14");
            expect(formatVariableValue(0)).toBe("0");
            expect(formatVariableValue(-1)).toBe("-1");
        });

        it("formats booleans", () => {
            expect(formatVariableValue(true)).toBe("true");
            expect(formatVariableValue(false)).toBe("false");
        });

        it("formats strings", () => {
            expect(formatVariableValue("hello")).toBe("hello");
            expect(formatVariableValue("")).toBe("");
        });

        it("truncates long strings to 60 chars", () => {
            const long = "a".repeat(100);
            const result = formatVariableValue(long);
            expect(result.length).toBe(60);
            expect(result).toBe("a".repeat(57) + "...");
        });

        it("formats objects with custom toString", () => {
            const obj = { toString: () => "Vector3(1, 2, 3)" };
            expect(formatVariableValue(obj)).toBe("Vector3(1, 2, 3)");
        });

        it("formats plain objects as JSON", () => {
            expect(formatVariableValue({ x: 1, y: 2 })).toBe('{"x":1,"y":2}');
        });

        it("truncates long JSON objects", () => {
            const obj: Record<string, number> = {};
            for (let i = 0; i < 20; i++) {
                obj[`longPropertyName${i}`] = i;
            }
            const result = formatVariableValue(obj);
            expect(result.length).toBe(60);
            expect(result.endsWith("...")).toBe(true);
        });

        it("formats arrays via their toString", () => {
            expect(formatVariableValue([1, 2, 3])).toBe("1,2,3");
        });

        it("handles circular references gracefully", () => {
            const obj: any = {};
            obj.self = obj;
            expect(formatVariableValue(obj)).toBe("[object]");
        });

        it("does not use Object.prototype.toString for plain objects", () => {
            const plain = { a: 1 };
            // plain.toString() === "[object Object]" — should use JSON instead
            expect(formatVariableValue(plain)).toBe('{"a":1}');
        });
    });

    // --------------------------------------------------------
    // filterSuggestions
    // --------------------------------------------------------
    describe("filterSuggestions", () => {
        const suggestions = ["playerHealth", "playerName", "enemyCount", "score", "isAlive"];

        it("returns all suggestions when query is empty", () => {
            expect(filterSuggestions(suggestions, "")).toEqual(suggestions);
        });

        it("filters case-insensitively", () => {
            expect(filterSuggestions(suggestions, "PLAYER")).toEqual(["playerHealth", "playerName"]);
        });

        it("matches substring anywhere in the string", () => {
            expect(filterSuggestions(suggestions, "count")).toEqual(["enemyCount"]);
        });

        it("returns empty array when nothing matches", () => {
            expect(filterSuggestions(suggestions, "xyz")).toEqual([]);
        });

        it("preserves order of original suggestions", () => {
            expect(filterSuggestions(suggestions, "e")).toEqual(["playerHealth", "playerName", "enemyCount", "score", "isAlive"]);
        });

        it("handles empty suggestions array", () => {
            expect(filterSuggestions([], "test")).toEqual([]);
        });
    });

    // --------------------------------------------------------
    // Constructor config registry (variable-picker kind)
    // --------------------------------------------------------
    describe("Constructor Config Registry", () => {
        it("registers FlowGraphGetVariableBlock with variable-picker kind", () => {
            const fields = CONSTRUCTOR_CONFIG.get("FlowGraphGetVariableBlock");
            expect(fields).toBeDefined();
            expect(fields).toHaveLength(1);
            expect(fields![0].key).toBe("variable");
            expect(fields![0].kind).toBe("variable-picker");
        });

        it("registers FlowGraphSetVariableBlock with variable-picker kind", () => {
            const fields = CONSTRUCTOR_CONFIG.get("FlowGraphSetVariableBlock");
            expect(fields).toBeDefined();
            expect(fields).toHaveLength(1);
            expect(fields![0].key).toBe("variable");
            expect(fields![0].kind).toBe("variable-picker");
        });
    });

    // --------------------------------------------------------
    // Integration: context persistence (the bug fix for issue #1)
    // --------------------------------------------------------
    describe("Context persistence", () => {
        it("variables added to context via createContext persist across gatherVariables calls", () => {
            const ctx = flowGraph.getContext(0) ?? flowGraph.createContext();
            ctx.setVariable("myNewVar", undefined);

            const result1 = gatherVariables(flowGraph);
            expect(result1.map((v) => v.name)).toContain("myNewVar");

            // Call again — should still be there
            const result2 = gatherVariables(flowGraph);
            expect(result2.map((v) => v.name)).toContain("myNewVar");
        });

        it("context variables survive after renaming", () => {
            flowGraphContext.setVariable("original", 100);

            renameVariable(flowGraph, "original", "renamed");

            const result = gatherVariables(flowGraph);
            expect(result.map((v) => v.name)).toContain("renamed");
            expect(result.map((v) => v.name)).not.toContain("original");
        });

        it("context variables are removed after deleteVariable", () => {
            flowGraphContext.setVariable("toGo", "bye");

            deleteVariable(flowGraph, "toGo");

            const result = gatherVariables(flowGraph);
            expect(result.map((v) => v.name)).not.toContain("toGo");
        });
    });
});
