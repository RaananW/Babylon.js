/**
 * glTF MCP Server – Preview Server Unit Tests
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { GltfManager } from "../../src/gltfManager";
import { startPreview, stopPreview, isPreviewRunning, getPreviewServerUrl, getSandboxUrl, getPreviewDocName, setPreviewDocument } from "../../src/previewServer";

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

function createManagerWithBox(name = "Box"): GltfManager {
    const mgr = new GltfManager();
    mgr.createGltf(name);
    mgr.addNode(name, "Root");
    mgr.addMesh(name, "BoxMesh");
    mgr.addMaterial(name, "Red");
    mgr.setMaterialPbr(name, 0, { baseColorFactor: [0.8, 0, 0, 1] });
    mgr.assignMeshToNode(name, 0, 0);
    return mgr;
}

// Use a high port range to avoid collisions during testing
let testPort = 19700;
function nextPort(): number {
    return testPort++;
}

/* ================================================================== */
/*  Tests                                                              */
/* ================================================================== */

describe("PreviewServer", () => {
    afterEach(async () => {
        // Always stop after each test
        if (isPreviewRunning()) {
            await stopPreview();
        }
    });

    describe("lifecycle", () => {
        it("should report not running before start", () => {
            expect(isPreviewRunning()).toBe(false);
            expect(getPreviewServerUrl()).toBeNull();
            expect(getSandboxUrl()).toBeNull();
            expect(getPreviewDocName()).toBeNull();
        });

        it("should start and stop correctly", async () => {
            const mgr = createManagerWithBox();
            const port = nextPort();

            const sandboxUrl = await startPreview(mgr, "Box", port);

            expect(isPreviewRunning()).toBe(true);
            expect(sandboxUrl).toContain("sandbox.babylonjs.com");
            expect(sandboxUrl).toContain(`http://localhost:${port}/model.glb`);
            expect(getPreviewServerUrl()).toBe(`http://localhost:${port}`);
            expect(getPreviewDocName()).toBe("Box");

            await stopPreview();

            expect(isPreviewRunning()).toBe(false);
            expect(getPreviewServerUrl()).toBeNull();
        });

        it("should reuse server when called again on same port", async () => {
            const mgr = createManagerWithBox();
            const port = nextPort();

            await startPreview(mgr, "Box", port);
            // Call again with different doc name, same port — should reuse
            mgr.createGltf("Other");
            const url2 = await startPreview(mgr, "Other", port);

            expect(isPreviewRunning()).toBe(true);
            expect(getPreviewDocName()).toBe("Other");
            expect(url2).toContain("sandbox.babylonjs.com");
        });

        it("should switch document with setPreviewDocument", async () => {
            const mgr = createManagerWithBox();
            mgr.createGltf("Other");
            const port = nextPort();

            await startPreview(mgr, "Box", port);
            expect(getPreviewDocName()).toBe("Box");

            setPreviewDocument("Other");
            expect(getPreviewDocName()).toBe("Other");
        });

        it("should stop gracefully when not running", async () => {
            // Should not throw
            await stopPreview();
            expect(isPreviewRunning()).toBe(false);
        });
    });

    describe("HTTP routes", () => {
        it("should serve GLB at /model.glb", async () => {
            const mgr = createManagerWithBox();
            const port = nextPort();
            await startPreview(mgr, "Box", port);

            const res = await fetch(`http://localhost:${port}/model.glb`);
            expect(res.status).toBe(200);
            expect(res.headers.get("content-type")).toBe("model/gltf-binary");
            expect(res.headers.get("access-control-allow-origin")).toBe("*");

            const buf = await res.arrayBuffer();
            // GLB magic number: 0x46546C67 ("glTF")
            const magic = new DataView(buf).getUint32(0, true);
            expect(magic).toBe(0x46546c67);
        });

        it("should serve JSON at /model.gltf", async () => {
            const mgr = createManagerWithBox();
            const port = nextPort();
            await startPreview(mgr, "Box", port);

            const res = await fetch(`http://localhost:${port}/model.gltf`);
            expect(res.status).toBe(200);
            expect(res.headers.get("content-type")).toBe("model/gltf+json");

            const json = await res.json();
            expect(json.asset.version).toBe("2.0");
            expect(json.nodes).toBeDefined();
        });

        it("should serve info at /api/info", async () => {
            const mgr = createManagerWithBox();
            const port = nextPort();
            await startPreview(mgr, "Box", port);

            const res = await fetch(`http://localhost:${port}/api/info`);
            expect(res.status).toBe(200);
            const text = await res.text();
            expect(text).toContain("Box");
            expect(text).toContain("Nodes");
        });

        it("should serve a viewer page at /", async () => {
            const mgr = createManagerWithBox();
            const port = nextPort();
            await startPreview(mgr, "Box", port);

            const res = await fetch(`http://localhost:${port}/`);
            expect(res.status).toBe(200);
            expect(res.headers.get("content-type")).toContain("text/html");
            const html = await res.text();
            expect(html).toContain("renderCanvas");
            expect(html).toContain("/model.glb");
            expect(html).toContain("sandbox.babylonjs.com");
            expect(html).toContain("animPanel");
            expect(html).toContain("animSelect");
        });

        it("should serve animation list at /api/animations", async () => {
            const mgr = createManagerWithBox();
            const port = nextPort();
            await startPreview(mgr, "Box", port);

            const res = await fetch(`http://localhost:${port}/api/animations`);
            expect(res.status).toBe(200);
            expect(res.headers.get("content-type")).toContain("application/json");
            const anims = await res.json();
            expect(Array.isArray(anims)).toBe(true);
            // Box has no animations
            expect(anims.length).toBe(0);
        });

        it("should return 404 for unknown routes", async () => {
            const mgr = createManagerWithBox();
            const port = nextPort();
            await startPreview(mgr, "Box", port);

            const res = await fetch(`http://localhost:${port}/unknown`);
            expect(res.status).toBe(404);
        });

        it("should return 404 if document does not exist", async () => {
            const mgr = createManagerWithBox();
            const port = nextPort();
            await startPreview(mgr, "NoSuchDoc", port);

            const res = await fetch(`http://localhost:${port}/model.glb`);
            expect(res.status).toBe(404);
        });

        it("should reflect edits on next request", async () => {
            const mgr = createManagerWithBox();
            const port = nextPort();
            await startPreview(mgr, "Box", port);

            // Get initial state
            const res1 = await fetch(`http://localhost:${port}/model.gltf`);
            const json1 = await res1.json();
            const initialNodeCount = json1.nodes.length;

            // Edit the document
            mgr.addNode("Box", "NewNode");

            // Fetch again — should have one more node
            const res2 = await fetch(`http://localhost:${port}/model.gltf`);
            const json2 = await res2.json();
            expect(json2.nodes.length).toBe(initialNodeCount + 1);
        });

        it("should handle CORS preflight", async () => {
            const mgr = createManagerWithBox();
            const port = nextPort();
            await startPreview(mgr, "Box", port);

            const res = await fetch(`http://localhost:${port}/model.glb`, { method: "OPTIONS" });
            expect(res.status).toBe(204);
            expect(res.headers.get("access-control-allow-origin")).toBe("*");
        });
    });
});
