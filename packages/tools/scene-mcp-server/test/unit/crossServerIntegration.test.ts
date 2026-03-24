import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { FlowGraphManager, resetUniqueIdCounter } from "../../../flow-graph-mcp-server/src/flowGraphManager";
import { GltfManager } from "../../../gltf-mcp-server/src/gltfManager";
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
        sfMgr.createGraph("blur");
        const sfJson = sfMgr.exportJSON("blur");
        expect(sfJson).not.toBeNull();

        const sceneMgr = new SceneManager();
        sceneMgr.createScene("s");
        ok(sceneMgr.attachSmartFilter("s", sfJson!));

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
        sfMgr.createGraph("postFx");
        const sfJson = sfMgr.exportJSON("postFx");
        expect(sfJson).not.toBeNull();

        const sceneMgr = new SceneManager();
        sceneMgr.createScene("s");

        ok(sceneMgr.attachSmartFilter("s", sfJson!));
        // Verify it's stored on the scene
        const scene = sceneMgr.getScene("s")!;
        expect(scene.smartFilterJson).toBeDefined();

        ok(sceneMgr.detachSmartFilter("s"));
        expect(scene.smartFilterJson).toBeUndefined();
    });

    it("rejects invalid Smart Filter JSON", () => {
        const sceneMgr = new SceneManager();
        sceneMgr.createScene("s");

        const result = sceneMgr.attachSmartFilter("s", { format: "wrong", formatVersion: 1, blocks: [], connections: [] });
        expect(result).toContain("format must be");
    });

    it("auto-includes Smart Filter JSON in exportProject", () => {
        const sfMgr = new SmartFiltersGraphManager();
        sfMgr.createGraph("pp");
        const sfJson = sfMgr.exportJSON("pp");

        const sceneMgr = new SceneManager();
        sceneMgr.createScene("s");
        ok(sceneMgr.attachSmartFilter("s", sfJson!));

        const project = sceneMgr.exportProject("s", { format: "es6" });
        expect(project).not.toBeNull();
        const indexTs = project!["src/index.ts"];
        expect(indexTs).toContain("SmartFilterDeserializer");
        expect(indexTs).toContain("@babylonjs/smart-filters");
        expect(indexTs).toContain("@babylonjs/smart-filters-blocks");

        // package.json should include smart-filter deps
        const pkg = JSON.parse(project!["package.json"]);
        expect(pkg.dependencies["@babylonjs/smart-filters"]).toBeDefined();
        expect(pkg.dependencies["@babylonjs/smart-filters-blocks"]).toBeDefined();
    });

    it("uses glTF MCP exported GLB file in scene add_model and generated code", () => {
        // 1. Build a minimal glTF document with a node, mesh, and material
        const gltfMgr = new GltfManager();
        gltfMgr.createGltf("character");
        gltfMgr.addNode("character", "Root");
        gltfMgr.addMesh("character", "Body");
        gltfMgr.assignMeshToNode("character", 0, 0);
        gltfMgr.addMaterial("character", "Skin");
        gltfMgr.setPrimitiveMaterial("character", 0, 0, 0);

        // 2. Export as GLB and write to a temp file
        const glb = gltfMgr.exportGlb("character");
        expect(glb).not.toBeNull();
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "gltf-scene-test-"));
        const glbPath = path.join(tmpDir, "character.glb");
        fs.writeFileSync(glbPath, glb!);
        expect(fs.existsSync(glbPath)).toBe(true);

        // 3. Verify the exported GLB is valid by re-importing it
        const reimported = gltfMgr.importGlb("character_reimport", glb!);
        expect(reimported).not.toContain("Error");

        // 4. Use SceneManager to add the GLB as a model
        const sceneMgr = new SceneManager();
        sceneMgr.createScene("s");
        sceneMgr.addCamera("s", "cam", "ArcRotateCamera", {
            alpha: -Math.PI / 2,
            beta: Math.PI / 3,
            radius: 5,
            target: { x: 0, y: 1, z: 0 },
            isActive: true,
        });
        sceneMgr.addLight("s", "light", "HemisphericLight");
        const modelResult = sceneMgr.addModel("s", "character", glbPath, undefined, undefined, {
            animationGroups: ["Walk", "Idle"],
        });
        expect(typeof modelResult).not.toBe("string");

        // 5. Verify generated code references the file and ImportMeshAsync
        const code = sceneMgr.exportCode("s", { format: "es6" });
        expect(code).not.toBeNull();
        expect(code).toContain("SceneLoader.ImportMeshAsync");
        expect(code).toContain("character.glb");
        expect(code).toContain('"character"');

        // 6. Verify animation group lookups appear in generated code
        expect(code).toContain("getAnimationGroupByName");
        expect(code).toContain('"Walk"');
        expect(code).toContain('"Idle"');

        // Cleanup temp file
        fs.unlinkSync(glbPath);
        fs.rmdirSync(tmpDir);
    });

    it("uses glTF MCP exported JSON in scene add_model and project export", () => {
        // 1. Build a glTF document
        const gltfMgr = new GltfManager();
        gltfMgr.createGltf("prop");
        gltfMgr.addNode("prop", "Crate");
        gltfMgr.addMesh("prop", "CrateMesh");
        gltfMgr.assignMeshToNode("prop", 0, 0);

        // 2. Export as JSON and write to a temp file
        const json = gltfMgr.exportJson("prop");
        expect(json).not.toBeNull();
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "gltf-scene-json-test-"));
        const gltfPath = path.join(tmpDir, "crate.gltf");
        fs.writeFileSync(gltfPath, json!);

        // 3. Add to scene and export as project
        const sceneMgr = new SceneManager();
        sceneMgr.createScene("s");
        sceneMgr.addCamera("s", "cam", "ArcRotateCamera", { isActive: true });
        const modelResult = sceneMgr.addModel("s", "crate", gltfPath);
        expect(typeof modelResult).not.toBe("string");

        const project = sceneMgr.exportProject("s", { format: "es6" });
        expect(project).not.toBeNull();
        const indexTs = project!["src/index.ts"];
        expect(indexTs).toContain("SceneLoader.ImportMeshAsync");
        expect(indexTs).toContain("crate.gltf");

        // Cleanup
        fs.unlinkSync(gltfPath);
        fs.rmdirSync(tmpDir);
    });

    it("round-trips glTF MCP document through GLB export, reimport, and scene integration", () => {
        // Build, export as GLB, reimport, verify structure is preserved
        const gltfMgr = new GltfManager();
        gltfMgr.createGltf("vehicle");
        gltfMgr.addNode("vehicle", "Chassis");
        gltfMgr.addNode("vehicle", "Wheel_FL", 0); // child of Chassis
        gltfMgr.addNode("vehicle", "Wheel_FR", 0); // child of Chassis
        gltfMgr.addMesh("vehicle", "ChassisBody");
        gltfMgr.addMesh("vehicle", "WheelMesh");
        gltfMgr.assignMeshToNode("vehicle", 0, 0);
        gltfMgr.assignMeshToNode("vehicle", 1, 1);
        gltfMgr.assignMeshToNode("vehicle", 2, 1);
        gltfMgr.addMaterial("vehicle", "PaintRed");

        const glb = gltfMgr.exportGlb("vehicle");
        expect(glb).not.toBeNull();

        // Reimport and verify the structure
        const result = gltfMgr.importGlb("vehicle_imported", glb!);
        expect(result).not.toContain("Error");

        const desc = gltfMgr.describeGltf("vehicle_imported");
        expect(desc).toContain("**Nodes**: 3");
        expect(desc).toContain("**Meshes**: 2");
        expect(desc).toContain("**Materials**: 1");

        // Use in scene
        const sceneMgr = new SceneManager();
        sceneMgr.createScene("s");
        sceneMgr.addCamera("s", "cam", "FreeCamera", { isActive: true });
        const modelResult = sceneMgr.addModel("s", "vehicle", "./assets/vehicle.glb", {
            position: { x: 0, y: 0, z: 5 },
        });
        expect(typeof modelResult).not.toBe("string");

        const code = sceneMgr.exportCode("s", { format: "es6" });
        expect(code).not.toBeNull();
        expect(code).toContain("SceneLoader.ImportMeshAsync");
        expect(code).toContain("vehicle.glb");
        expect(code).toContain("position");
    });
});
