import { FlowGraphManager, resetUniqueIdCounter } from "../../../flow-graph-mcp-server/src/flowGraphManager";
import { GuiManager } from "../../../gui-mcp-server/src/guiManager";
import { GeometryGraphManager } from "../../../nge-mcp-server/src/geometryGraph";
import { MaterialGraphManager } from "../../../nme-mcp-server/src/materialGraph";
import { RenderGraphManager } from "../../../node-render-graph-mcp-server/src/renderGraph";
import { SmartFiltersGraphManager } from "../../../smart-filters-mcp-server/src/smartFiltersGraph";
import { SceneManager } from "../../src/sceneManager";

function getSceneId(result: string | { id: string }): string {
    if (typeof result === "string") {
        throw new Error(result);
    }
    return result.id;
}

function ok(result: string): void {
    expect(result).toBe("OK");
}

function createSimpleNodeMaterialJson(): string {
    const mgr = new MaterialGraphManager();
    mgr.createMaterial("simpleColor");

    const position = mgr.addBlock("simpleColor", "InputBlock", "position", { type: "Vector3", mode: "Attribute", attributeName: "position" });
    const worldViewProjection = mgr.addBlock("simpleColor", "InputBlock", "worldViewProjection", { type: "Matrix", systemValue: "WorldViewProjection" });
    const transform = mgr.addBlock("simpleColor", "TransformBlock", "worldPos");
    const vertexOutput = mgr.addBlock("simpleColor", "VertexOutputBlock", "vertexOutput");
    const color = mgr.addBlock("simpleColor", "InputBlock", "color", { type: "Color3", value: [1, 0, 0] });
    const fragmentOutput = mgr.addBlock("simpleColor", "FragmentOutputBlock", "fragmentOutput");

    const getBlockId = (result: any) => {
        if (typeof result === "string") {
            throw new Error(result);
        }
        return result.block.id;
    };

    ok(mgr.connectBlocks("simpleColor", getBlockId(position), "output", getBlockId(transform), "vector"));
    ok(mgr.connectBlocks("simpleColor", getBlockId(worldViewProjection), "output", getBlockId(transform), "transform"));
    ok(mgr.connectBlocks("simpleColor", getBlockId(transform), "output", getBlockId(vertexOutput), "vector"));
    ok(mgr.connectBlocks("simpleColor", getBlockId(color), "output", getBlockId(fragmentOutput), "rgb"));

    const json = mgr.exportJSON("simpleColor");
    if (!json) {
        throw new Error("Expected exported Node Material JSON.");
    }
    return json;
}

describe("Scene MCP Server – Cross-server integration coverage", () => {
    beforeEach(() => {
        resetUniqueIdCounter();
    });

    it("uses exported GUI JSON in generated scene code", () => {
        const guiMgr = new GuiManager();
        guiMgr.createTexture("hud");
        const added = guiMgr.addControl("hud", "TextBlock", "score", "root", { text: "Score: 0", color: "white" });
        if (typeof added === "string") {
            throw new Error(added);
        }

        const guiJson = guiMgr.exportJSON("hud");
        expect(guiJson).not.toBeNull();

        const sceneMgr = new SceneManager();
        sceneMgr.createScene("s");
        ok(sceneMgr.attachGUI("s", guiJson!));

        const code = sceneMgr.exportCode("s", { format: "es6" });
        expect(code).not.toBeNull();
        expect(code).toContain("AdvancedDynamicTexture.CreateFullscreenUI");
        expect(code).toContain('new TextBlock("score", "Score: 0")');
        expect(code).toContain("Score: 0");
    });

    it("uses exported Node Material JSON in generated scene code", () => {
        const nmeJson = createSimpleNodeMaterialJson();

        const sceneMgr = new SceneManager();
        sceneMgr.createScene("s");
        const meshId = getSceneId(sceneMgr.addMesh("s", "box", "Box"));
        const materialId = getSceneId(sceneMgr.addMaterial("s", "custom", "NodeMaterial", {}, nmeJson));
        ok(sceneMgr.assignMaterial("s", meshId, materialId));

        const code = sceneMgr.exportCode("s", { format: "es6" });
        expect(code).not.toBeNull();
        expect(code).toContain("NodeMaterial.Parse");
        expect(code).toContain("BABYLON.FragmentOutputBlock");
        expect(code).toContain("box.material = custom;");
    });

    it("uses exported Flow Graph JSON in generated scene code", () => {
        const flowMgr = new FlowGraphManager();
        flowMgr.createGraph("logic");
        const eventId = (() => {
            const result = flowMgr.addBlock("logic", "SceneReadyEvent");
            if (typeof result === "string") {
                throw new Error(result);
            }
            return result.id;
        })();
        const logId = (() => {
            const result = flowMgr.addBlock("logic", "ConsoleLog", "logger", { message: "ready" });
            if (typeof result === "string") {
                throw new Error(result);
            }
            return result.id;
        })();
        ok(flowMgr.connectSignal("logic", eventId, "out", logId, "in"));

        const flowJson = flowMgr.exportJSON("logic");
        expect(flowJson).not.toBeNull();

        const sceneMgr = new SceneManager();
        sceneMgr.createScene("s");
        const result = sceneMgr.attachFlowGraph("s", "logic", flowJson!);
        expect(typeof result).not.toBe("string");

        const code = sceneMgr.exportCode("s", { format: "es6" });
        expect(code).not.toBeNull();
        expect(code).toContain("ParseCoordinatorAsync");
        expect(code).toContain("FlowGraphConsoleLogBlock");
        expect(code).toContain("Coordinator.start()");
    });

    it("uses exported Node Render Graph and Node Geometry JSON in generated project code", () => {
        const renderMgr = new RenderGraphManager();
        renderMgr.create("frameGraph");
        renderMgr.addBlock("frameGraph", "NodeRenderGraphOutputBlock", "output");
        const nrgJson = renderMgr.exportJson("frameGraph");

        const geometryMgr = new GeometryGraphManager();
        geometryMgr.createGeometry("terrain");
        const box = geometryMgr.addBlock("terrain", "BoxBlock", "box");
        const output = geometryMgr.addBlock("terrain", "GeometryOutputBlock", "output");
        if (typeof box === "string" || typeof output === "string") {
            throw new Error(typeof box === "string" ? box : String(output));
        }
        ok(geometryMgr.connectBlocks("terrain", box.block.id, "geometry", output.block.id, "geometry"));
        const ngeJson = geometryMgr.exportJSON("terrain");
        expect(ngeJson).toBeDefined();

        const sceneMgr = new SceneManager();
        sceneMgr.createScene("s");
        ok(sceneMgr.attachNodeRenderGraph("s", nrgJson));
        ok(sceneMgr.addNodeGeometryMesh("s", "terrain", ngeJson!));

        const project = sceneMgr.exportProject("s", { format: "es6" });
        expect(project).not.toBeNull();
        const indexTs = project!["src/index.ts"];
        expect(indexTs).toContain("NodeRenderGraph.ParseAsync");
        expect(indexTs).toContain("BABYLON.NodeRenderGraphOutputBlock");
        expect(indexTs).toContain("NodeGeometry.Parse");
        expect(indexTs).toContain('createMesh("terrain"');
        expect(indexTs).toContain("BABYLON.BoxBlock");
    });

    it("uses exported Smart Filter JSON in generated scene code", () => {
        const sfMgr = new SmartFiltersGraphManager();
        sfMgr.createGraph("sf1");
        const sfJson = sfMgr.exportJSON("sf1");
        expect(sfJson).toBeDefined();

        const sceneMgr = new SceneManager();
        sceneMgr.createScene("s");
        ok(sceneMgr.attachSmartFilter("s", sfJson));

        const code = sceneMgr.exportCode("s");
        expect(code).not.toBeNull();
        expect(code).toContain("SmartFilterDeserializer");
        expect(code).toContain("BuiltInBlockRegistrations");
        expect(code).toContain("InputBlockDeserializer");
        expect(code).toContain("createRuntimeAsync");
        expect(code).toContain("onAfterRenderObservable");
    });

    it("attaches and detaches Smart Filter from scene", () => {
        const sfMgr = new SmartFiltersGraphManager();
        sfMgr.createGraph("sf1");
        const sfJson = sfMgr.exportJSON("sf1");

        const sceneMgr = new SceneManager();
        sceneMgr.createScene("s");
        ok(sceneMgr.attachSmartFilter("s", sfJson));

        const desc = sceneMgr.describeScene("s");
        expect(desc).toContain("Smart Filter: attached");

        ok(sceneMgr.detachSmartFilter("s"));
        const desc2 = sceneMgr.describeScene("s");
        expect(desc2).not.toContain("Smart Filter: attached");
    });

    it("rejects invalid Smart Filter JSON", () => {
        const sceneMgr = new SceneManager();
        sceneMgr.createScene("s");
        const result = sceneMgr.attachSmartFilter("s", { format: "wrong" });
        expect(typeof result).toBe("string");
        expect(result).toContain("Invalid Smart Filter");
    });

    it("auto-includes Smart Filter JSON in exportProject", () => {
        const sfMgr = new SmartFiltersGraphManager();
        sfMgr.createGraph("sf1");
        const sfJson = sfMgr.exportJSON("sf1");

        const sceneMgr = new SceneManager();
        sceneMgr.createScene("s");
        ok(sceneMgr.attachSmartFilter("s", sfJson));

        const project = sceneMgr.exportProject("s", { format: "es6" });
        expect(project).not.toBeNull();
        const indexTs = project!["src/index.ts"];
        expect(indexTs).toContain("SmartFilterDeserializer");
        expect(indexTs).toContain('@babylonjs/smart-filters');
        expect(indexTs).toContain('@babylonjs/smart-filters-blocks');

        const pkgJson = JSON.parse(project!["package.json"]);
        expect(pkgJson.dependencies).toHaveProperty("@babylonjs/smart-filters");
        expect(pkgJson.dependencies).toHaveProperty("@babylonjs/smart-filters-blocks");
    });
});
