import * as fs from "fs";
import * as path from "path";
import { SceneManager } from "../../src/sceneManager";

const EXAMPLES_DIR = path.resolve(__dirname, "../../examples");

function getId(result: string | { id: string }): string {
    if (typeof result === "string") throw new Error(`Expected {id}, got error: ${result}`);
    return result.id;
}

function ok(result: string): void {
    if (result !== "OK") throw new Error(`Expected "OK", got: ${result}`);
}

/**
 * Build a rich scene for structural validation.
 */
function buildTestScene(): { mgr: SceneManager; json: string } {
    const mgr = new SceneManager();
    mgr.createScene("parseTest", "Scene for parse validation");
    ok(mgr.setEnvironment("parseTest", { physicsEnabled: true }));

    const camId = getId(mgr.addCamera("parseTest", "cam1", "ArcRotateCamera"));
    ok(mgr.setActiveCamera("parseTest", camId));
    getId(mgr.addLight("parseTest", "light1", "HemisphericLight"));
    getId(mgr.addLight("parseTest", "dirLight", "DirectionalLight"));

    const matId = getId(mgr.addMaterial("parseTest", "mat1", "PBRMaterial"));
    getId(mgr.addTransformNode("parseTest", "root"));
    const meshId = getId(mgr.addMesh("parseTest", "box1", "Box", { size: 2 }));
    ok(mgr.assignMaterial("parseTest", meshId, matId));
    ok(mgr.addPhysicsBody("parseTest", meshId, "Dynamic", "Box", { mass: 1 }));

    const mesh2 = getId(mgr.addMesh("parseTest", "sphere1", "Sphere", { diameter: 1 }, { position: { x: 3, y: 0, z: 0 } }));
    ok(mgr.addPhysicsBody("parseTest", mesh2, "Dynamic", "Sphere", { mass: 2 }));
    getId(mgr.addPhysicsConstraint("parseTest", "joint1", "Hinge", meshId, mesh2));

    getId(
        mgr.addAnimation(
            "parseTest",
            "anim1",
            meshId,
            "position.y",
            60,
            [
                { frame: 0, value: 0 },
                { frame: 30, value: 3 },
                { frame: 60, value: 0 },
            ],
            "Cycle"
        )
    );

    getId(mgr.addSound("parseTest", "bgm", "audio/bg.mp3", "static", { loop: true }));

    const psId = getId(
        mgr.addParticleSystem("parseTest", "fire", 1000, meshId, {
            emitterType: "Cone",
            emitRate: 50,
        })
    );
    ok(mgr.addParticleGradient("parseTest", psId, "color", 0, { r: 1, g: 1, b: 0, a: 1 }));

    ok(mgr.configureRenderPipeline("parseTest", { bloomEnabled: true, fxaaEnabled: true }));
    const glowId = getId(mgr.addGlowLayer("parseTest", "glow1", { intensity: 0.5 }));
    ok(mgr.addMeshToGlowLayer("parseTest", glowId, meshId, "include"));
    const hlId = getId(mgr.addHighlightLayer("parseTest", "hl1"));
    ok(mgr.addMeshToHighlightLayer("parseTest", hlId, mesh2, { r: 0, g: 1, b: 0 }));

    const json = mgr.exportJSON("parseTest")!;
    return { mgr, json };
}

describe("Scene MCP Server – Parse Validation", () => {
    let parsed: Record<string, unknown>;

    beforeAll(() => {
        const { json } = buildTestScene();
        parsed = JSON.parse(json);
    });

    // ── Top-level structure ──────────────────────────────────────────────

    it("has version, name, and description", () => {
        expect(parsed.version).toBe("1.0.0");
        expect(parsed.name).toBe("parseTest");
        expect(parsed.description).toBe("Scene for parse validation");
    });

    it("has all required top-level arrays", () => {
        const arrayFields = [
            "textures",
            "materials",
            "transformNodes",
            "meshes",
            "models",
            "cameras",
            "lights",
            "animations",
            "animationGroups",
            "flowGraphs",
            "sounds",
            "particleSystems",
            "physicsConstraints",
            "glowLayers",
            "highlightLayers",
        ];
        for (const field of arrayFields) {
            expect(Array.isArray(parsed[field])).toBe(true);
        }
    });

    it("has environment with required color fields", () => {
        const env = parsed.environment as Record<string, unknown>;
        expect(env).toBeDefined();
        expect(env.clearColor).toBeDefined();
        expect(env.ambientColor).toBeDefined();
        expect(env.gravity).toBeDefined();
        expect(env.physicsEnabled).toBe(true);
    });

    // ── ID pattern validation ────────────────────────────────────────────

    it("mesh IDs follow prefix_N pattern", () => {
        const meshes = parsed.meshes as Array<{ id: string }>;
        for (const m of meshes) {
            expect(m.id).toMatch(/^mesh_\d+$/);
        }
    });

    it("camera IDs follow prefix_N pattern", () => {
        const cameras = parsed.cameras as Array<{ id: string }>;
        for (const c of cameras) {
            expect(c.id).toMatch(/^cam_\d+$/);
        }
    });

    it("light IDs follow prefix_N pattern", () => {
        const lights = parsed.lights as Array<{ id: string }>;
        for (const l of lights) {
            expect(l.id).toMatch(/^light_\d+$/);
        }
    });

    it("material IDs follow prefix_N pattern", () => {
        const materials = parsed.materials as Array<{ id: string }>;
        for (const m of materials) {
            expect(m.id).toMatch(/^mat_\d+$/);
        }
    });

    it("animation IDs follow prefix_N pattern", () => {
        const animations = parsed.animations as Array<{ id: string }>;
        for (const a of animations) {
            expect(a.id).toMatch(/^anim_\d+$/);
        }
    });

    it("sound IDs follow prefix_N pattern", () => {
        const sounds = parsed.sounds as Array<{ id: string }>;
        for (const s of sounds) {
            expect(s.id).toMatch(/^snd_\d+$/);
        }
    });

    it("particle system IDs follow prefix_N pattern", () => {
        const ps = parsed.particleSystems as Array<{ id: string }>;
        for (const p of ps) {
            expect(p.id).toMatch(/^ps_\d+$/);
        }
    });

    it("glow layer IDs follow prefix_N pattern", () => {
        const layers = parsed.glowLayers as Array<{ id: string }>;
        for (const l of layers) {
            expect(l.id).toMatch(/^glow_\d+$/);
        }
    });

    it("highlight layer IDs follow prefix_N pattern", () => {
        const layers = parsed.highlightLayers as Array<{ id: string }>;
        for (const l of layers) {
            expect(l.id).toMatch(/^highlight_\d+$/);
        }
    });

    // ── Mesh structure ───────────────────────────────────────────────────

    it("each mesh has required fields", () => {
        const meshes = parsed.meshes as Array<Record<string, unknown>>;
        for (const m of meshes) {
            expect(m.id).toBeDefined();
            expect(m.name).toBeDefined();
            expect(m.primitiveType).toBeDefined();
            expect(typeof m.isVisible).toBe("boolean");
            expect(typeof m.isPickable).toBe("boolean");
            expect(typeof m.receiveShadows).toBe("boolean");
        }
    });

    it("meshes with physics have bodyType and shapeType", () => {
        const meshes = parsed.meshes as Array<Record<string, unknown>>;
        const withPhysics = meshes.filter((m) => m.physics);
        expect(withPhysics.length).toBeGreaterThan(0);
        for (const m of withPhysics) {
            const phys = m.physics as Record<string, unknown>;
            expect(typeof phys.bodyType).toBe("number");
            expect(typeof phys.shapeType).toBe("string");
        }
    });

    // ── Camera structure ─────────────────────────────────────────────────

    it("cameras have type and name", () => {
        const cameras = parsed.cameras as Array<Record<string, unknown>>;
        for (const c of cameras) {
            expect(c.id).toBeDefined();
            expect(c.name).toBeDefined();
            expect(c.type).toBeDefined();
        }
    });

    it("active camera ID references a valid camera", () => {
        const camIds = (parsed.cameras as Array<{ id: string }>).map((c) => c.id);
        expect(camIds).toContain(parsed.activeCameraId);
    });

    // ── Light structure ──────────────────────────────────────────────────

    it("lights have type and name", () => {
        const lights = parsed.lights as Array<Record<string, unknown>>;
        for (const l of lights) {
            expect(l.id).toBeDefined();
            expect(l.name).toBeDefined();
            expect(l.type).toBeDefined();
        }
    });

    // ── Animation structure ──────────────────────────────────────────────

    it("animations have target, property, and keys", () => {
        const anims = parsed.animations as Array<Record<string, unknown>>;
        for (const a of anims) {
            expect(a.id).toBeDefined();
            expect(a.targetId).toBeDefined();
            expect(a.property).toBeDefined();
            expect(typeof a.fps).toBe("number");
            expect(Array.isArray(a.keys)).toBe(true);
            const keys = a.keys as Array<{ frame: number; value: unknown }>;
            for (const k of keys) {
                expect(typeof k.frame).toBe("number");
                expect(k.value).toBeDefined();
            }
        }
    });

    // ── Cross-reference validation ───────────────────────────────────────

    it("material assignments reference existing materials", () => {
        const matIds = (parsed.materials as Array<{ id: string }>).map((m) => m.id);
        const meshes = parsed.meshes as Array<Record<string, unknown>>;
        for (const m of meshes) {
            if (m.materialId) {
                expect(matIds).toContain(m.materialId);
            }
        }
    });

    it("animation targets reference existing meshes or nodes", () => {
        const meshIds = (parsed.meshes as Array<{ id: string }>).map((m) => m.id);
        const nodeIds = (parsed.transformNodes as Array<{ id: string }>).map((n) => n.id);
        const allIds = [...meshIds, ...nodeIds];
        const anims = parsed.animations as Array<Record<string, unknown>>;
        for (const a of anims) {
            expect(allIds).toContain(a.targetId);
        }
    });

    it("physics constraint references meshes with physics bodies", () => {
        const meshes = parsed.meshes as Array<Record<string, unknown>>;
        const meshesWithPhysics = meshes.filter((m) => m.physics).map((m) => m.id as string);
        const constraints = parsed.physicsConstraints as Array<Record<string, unknown>>;
        for (const c of constraints) {
            expect(meshesWithPhysics).toContain(c.parentMeshId);
            expect(meshesWithPhysics).toContain(c.childMeshId);
        }
    });

    it("glow layer mesh references are valid", () => {
        const meshIds = (parsed.meshes as Array<{ id: string }>).map((m) => m.id);
        const glowLayers = parsed.glowLayers as Array<{ includedOnlyMeshIds?: string[]; excludedMeshIds?: string[] }>;
        for (const gl of glowLayers) {
            for (const id of gl.includedOnlyMeshIds ?? []) {
                expect(meshIds).toContain(id);
            }
            for (const id of gl.excludedMeshIds ?? []) {
                expect(meshIds).toContain(id);
            }
        }
    });

    it("highlight layer mesh references are valid", () => {
        const meshIds = (parsed.meshes as Array<{ id: string }>).map((m) => m.id);
        const hlLayers = parsed.highlightLayers as Array<{ meshes?: Array<{ meshId: string }> }>;
        for (const hl of hlLayers) {
            for (const entry of hl.meshes ?? []) {
                expect(meshIds).toContain(entry.meshId);
            }
        }
    });

    // ── Render pipeline ──────────────────────────────────────────────────

    it("render pipeline has expected enabled flags", () => {
        const rp = parsed.renderPipeline as Record<string, unknown>;
        expect(rp).toBeDefined();
        expect(rp.id).toBeDefined();
        expect(rp.bloomEnabled).toBe(true);
        expect(rp.fxaaEnabled).toBe(true);
    });

    // ── Sound structure ──────────────────────────────────────────────────

    it("sounds have url and soundType", () => {
        const sounds = parsed.sounds as Array<Record<string, unknown>>;
        for (const s of sounds) {
            expect(s.id).toBeDefined();
            expect(s.name).toBeDefined();
            expect(typeof s.url).toBe("string");
            expect(typeof s.soundType).toBe("string");
        }
    });

    // ── Particle system structure ────────────────────────────────────────

    it("particle systems have capacity and emitter", () => {
        const ps = parsed.particleSystems as Array<Record<string, unknown>>;
        for (const p of ps) {
            expect(p.id).toBeDefined();
            expect(p.name).toBeDefined();
            expect(typeof p.capacity).toBe("number");
            expect(p.emitter).toBeDefined();
        }
    });

    // ── All generated examples pass structural validation ────────────────

    it("all generated example files are non-empty and valid", () => {
        if (!fs.existsSync(EXAMPLES_DIR)) {
            return; // examples not yet generated
        }
        const entries = fs.readdirSync(EXAMPLES_DIR);
        expect(entries.length).toBeGreaterThan(0);

        for (const entry of entries) {
            const fullPath = path.join(EXAMPLES_DIR, entry);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                // ES6 project directories must contain package.json and src/index.ts
                const pkgPath = path.join(fullPath, "package.json");
                const srcPath = path.join(fullPath, "src", "index.ts");
                expect(fs.existsSync(pkgPath)).toBe(true);
                expect(fs.existsSync(srcPath)).toBe(true);
                const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
                expect(pkg.dependencies).toBeDefined();
                const src = fs.readFileSync(srcPath, "utf-8");
                expect(src.length).toBeGreaterThan(0);
                expect(src).toContain("Scene");
            } else if (entry.endsWith(".html")) {
                const content = fs.readFileSync(fullPath, "utf-8");
                expect(content.length).toBeGreaterThan(0);
                expect(content).toContain("BABYLON");
                expect(content).toContain("<script");
            } else if (entry.endsWith(".ts")) {
                const content = fs.readFileSync(fullPath, "utf-8");
                expect(content.length).toBeGreaterThan(0);
                expect(content).toContain("Scene");
            }
        }
    });

    // ── Round-trip: import → export preserves structure ───────────────────

    it("importJSON → exportJSON round-trip preserves structure", () => {
        const { json } = buildTestScene();
        const mgr2 = new SceneManager();
        const importResult = mgr2.importJSON("roundTrip", json);
        expect(importResult).not.toContain("Error");

        const reExported = mgr2.exportJSON("roundTrip")!;
        const reParsed = JSON.parse(reExported);

        expect(reParsed.version).toBe("1.0.0");
        expect(reParsed.meshes).toHaveLength((parsed.meshes as unknown[]).length);
        expect(reParsed.cameras).toHaveLength((parsed.cameras as unknown[]).length);
        expect(reParsed.lights).toHaveLength((parsed.lights as unknown[]).length);
        expect(reParsed.animations).toHaveLength((parsed.animations as unknown[]).length);
    });
});
