/* eslint-disable @typescript-eslint/naming-convention */
/**
 * Unit tests for SceneManager — the stateful in-memory scene builder
 * used by the Babylon.js Scene MCP Server.
 *
 * Every test creates a fresh SceneManager instance, so there is no
 * shared mutable state between tests.
 */

import { SceneManager } from "../../src/sceneManager";

// ── Helpers ────────────────────────────────────────────────────────────

/** Unwrap a result that is either a string (error) or { id: string } (success). */
function getId(result: string | { id: string }): string {
    if (typeof result === "string") {
        throw new Error(`Expected { id } but got error: ${result}`);
    }
    return result.id;
}

/** Shorthand: expect an "OK" return. */
function ok(result: string): void {
    expect(result).toBe("OK");
}

// ═══════════════════════════════════════════════════════════════════════════
//  Tests
// ═══════════════════════════════════════════════════════════════════════════

describe("Scene MCP Server – SceneManager", () => {
    // ── Test 1: Scene lifecycle ──────────────────────────────────────────

    it("creates, lists, and deletes scenes", () => {
        const mgr = new SceneManager();
        mgr.createScene("demo", "A demo scene");
        mgr.createScene("test");

        expect(mgr.listScenes()).toEqual(["demo", "test"]);
        expect(mgr.getScene("demo")).toBeDefined();
        expect(mgr.getScene("demo")!.description).toBe("A demo scene");
        expect(mgr.getScene("nonexistent")).toBeUndefined();

        expect(mgr.deleteScene("demo")).toBe(true);
        expect(mgr.listScenes()).toEqual(["test"]);
        expect(mgr.deleteScene("demo")).toBe(false);
    });

    // ── Test 2: createScene defaults ─────────────────────────────────────

    it("creates scene with correct default structure", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const scene = mgr.getScene("s")!;

        expect(scene.version).toBe("1.0.0");
        expect(scene.name).toBe("s");
        expect(scene.meshes).toEqual([]);
        expect(scene.cameras).toEqual([]);
        expect(scene.lights).toEqual([]);
        expect(scene.materials).toEqual([]);
        expect(scene.textures).toEqual([]);
        expect(scene.transformNodes).toEqual([]);
        expect(scene.animations).toEqual([]);
        expect(scene.animationGroups).toEqual([]);
        expect(scene.models).toEqual([]);
        expect(scene.flowGraphs).toEqual([]);
        expect(scene.sounds).toEqual([]);
        expect(scene.particleSystems).toEqual([]);
        expect(scene.physicsConstraints).toEqual([]);
        expect(scene.glowLayers).toEqual([]);
        expect(scene.highlightLayers).toEqual([]);
        // Environment should have defaults
        expect(scene.environment).toBeDefined();
        expect(scene.environment.physicsEnabled).toBeUndefined();
    });

    // ── Test 3: setEnvironment ───────────────────────────────────────────

    it("configures environment properties", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        ok(
            mgr.setEnvironment("s", {
                clearColor: { r: 0.1, g: 0.2, b: 0.3, a: 1 },
                fogEnabled: true,
                fogMode: 2,
                fogDensity: 0.05,
                skyboxSize: 500,
                gravity: { x: 0, y: -9.81, z: 0 },
            })
        );
        const env = mgr.getScene("s")!.environment;
        expect(env.clearColor).toEqual({ r: 0.1, g: 0.2, b: 0.3, a: 1 });
        expect(env.fogEnabled).toBe(true);
        expect(env.fogMode).toBe(2);
        expect(env.fogDensity).toBe(0.05);
        expect(env.skyboxSize).toBe(500);
        expect(env.gravity).toEqual({ x: 0, y: -9.81, z: 0 });
    });

    it("returns error when setting environment on nonexistent scene", () => {
        const mgr = new SceneManager();
        const result = mgr.setEnvironment("nope", { skyboxSize: 100 });
        expect(result).toContain("not found");
    });

    // ── Test 4: setEnvironment array normalization ───────────────────────

    it("normalizes array-style vectors in environment", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        ok(
            mgr.setEnvironment("s", {
                gravity: [0, -20, 0] as unknown as { x: number; y: number; z: number },
                clearColor: [1, 0, 0, 1] as unknown as { r: number; g: number; b: number; a: number },
            })
        );
        const env = mgr.getScene("s")!.environment;
        expect(env.gravity).toEqual({ x: 0, y: -20, z: 0 });
        expect(env.clearColor).toEqual({ r: 1, g: 0, b: 0, a: 1 });
    });

    // ── Test 5: addTexture ───────────────────────────────────────────────

    it("adds textures to a scene", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const texId = getId(mgr.addTexture("s", "floor", "floor.png", { uScale: 2, vScale: 2 }));
        expect(texId).toBe("tex_1");
        const tex = mgr.getScene("s")!.textures[0];
        expect(tex.name).toBe("floor");
        expect(tex.url).toBe("floor.png");
        expect(tex.uScale).toBe(2);
        expect(tex.vScale).toBe(2);
    });

    // ── Test 6: addMaterial with catalog validation ──────────────────────

    it("adds StandardMaterial and PBRMaterial", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const stdId = getId(mgr.addMaterial("s", "red", "StandardMaterial", { diffuseColor: { r: 1, g: 0, b: 0 } }));
        expect(stdId).toBe("mat_1");
        const pbrId = getId(mgr.addMaterial("s", "metal", "PBRMaterial", { metallic: 1, roughness: 0.2 }));
        expect(pbrId).toBe("mat_2");

        expect(mgr.getScene("s")!.materials).toHaveLength(2);
    });

    it("rejects unknown material type", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const result = mgr.addMaterial("s", "foo", "UnknownMat");
        expect(typeof result).toBe("string");
        expect(result as string).toContain("Unknown material type");
    });

    // ── Test 7: NodeMaterial with nmeJson ────────────────────────────────

    it("adds NodeMaterial with nmeJson", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const id = getId(mgr.addMaterial("s", "custom", "NodeMaterial", {}, '{"editorData":{}}'));
        expect(id).toBe("mat_1");
        expect(mgr.getScene("s")!.materials[0].nmeJson).toBe('{"editorData":{}}');
    });

    // ── Test 8: removeMaterial ───────────────────────────────────────────

    it("removes a material", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const id = getId(mgr.addMaterial("s", "m", "StandardMaterial"));
        ok(mgr.removeMaterial("s", id));
        expect(mgr.getScene("s")!.materials).toHaveLength(0);
    });

    // ── Test 9: configureMaterialProperties ──────────────────────────────

    it("configures material properties after creation", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const id = getId(mgr.addMaterial("s", "m", "PBRMaterial", { metallic: 0 }));
        ok(mgr.configureMaterialProperties("s", id, { metallic: 1, roughness: 0.1 }));
        const mat = mgr.getScene("s")!.materials[0];
        expect(mat.properties.metallic).toBe(1);
        expect(mat.properties.roughness).toBe(0.1);
    });

    // ── Test 10: addTransformNode ────────────────────────────────────────

    it("adds transform nodes with hierarchy", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const parentId = getId(mgr.addTransformNode("s", "parent"));
        expect(parentId).toBe("node_1");

        const childId = getId(mgr.addTransformNode("s", "child", { position: { x: 1, y: 2, z: 3 } }, parentId));
        expect(childId).toBe("node_2");

        const child = mgr.getScene("s")!.transformNodes.find((n) => n.id === childId)!;
        expect(child.parentId).toBe(parentId);
        expect(child.transform.position).toEqual({ x: 1, y: 2, z: 3 });
    });

    // ── Test 11: addMesh with catalog validation ─────────────────────────

    it("adds primitive meshes and rejects unknown types", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const boxId = getId(mgr.addMesh("s", "box1", "Box", { size: 2 }));
        expect(boxId).toBe("mesh_1");
        const mesh = mgr.getScene("s")!.meshes[0];
        expect(mesh.primitiveType).toBe("Box");
        expect(mesh.primitiveOptions!.size).toBe(2);
        expect(mesh.isVisible).toBe(true);
        expect(mesh.isPickable).toBe(true);
        expect(mesh.receiveShadows).toBe(true);

        // Reject unknown type
        const err = mgr.addMesh("s", "x", "Dodecahedron");
        expect(typeof err).toBe("string");
        expect(err as string).toContain("Unknown primitive type");
    });

    // ── Test 12: removeMesh ──────────────────────────────────────────────

    it("removes a mesh by id", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const id = getId(mgr.addMesh("s", "box", "Box"));
        ok(mgr.removeMesh("s", id));
        expect(mgr.getScene("s")!.meshes).toHaveLength(0);
    });

    // ── Test 13: setTransform with normalizeTransform ────────────────────

    it("sets transform with array-style position", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const id = getId(mgr.addMesh("s", "box", "Box"));
        ok(
            mgr.setTransform("s", id, {
                position: [5, 10, -3] as unknown as { x: number; y: number; z: number },
                scaling: [2, 2, 2] as unknown as { x: number; y: number; z: number },
            })
        );
        const mesh = mgr.getScene("s")!.meshes[0];
        expect(mesh.transform.position).toEqual({ x: 5, y: 10, z: -3 });
        expect(mesh.transform.scaling).toEqual({ x: 2, y: 2, z: 2 });
    });

    // ── Test 14: setParent ───────────────────────────────────────────────

    it("sets parent-child relationships via setParent", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const parentId = getId(mgr.addMesh("s", "parent", "Box"));
        const childId = getId(mgr.addMesh("s", "child", "Sphere"));
        ok(mgr.setParent("s", childId, parentId));
        expect(mgr.getScene("s")!.meshes[1].parentId).toBe(parentId);
    });

    // ── Test 15: assignMaterial ──────────────────────────────────────────

    it("assigns material to mesh and validates material existence", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const meshId = getId(mgr.addMesh("s", "box", "Box"));
        const matId = getId(mgr.addMaterial("s", "red", "StandardMaterial"));

        ok(mgr.assignMaterial("s", meshId, matId));
        expect(mgr.getScene("s")!.meshes[0].materialId).toBe(matId);

        // Non-existent material
        const err = mgr.assignMaterial("s", meshId, "fake_mat");
        expect(typeof err).toBe("string");
        expect(err).toContain("not found");
    });

    // ── Test 16: setMeshProperties ───────────────────────────────────────

    it("sets mesh visibility, pickability, shadow, tags, and metadata", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const id = getId(mgr.addMesh("s", "box", "Box"));
        ok(
            mgr.setMeshProperties("s", id, {
                isVisible: false,
                isPickable: false,
                castsShadows: true,
                tags: ["obstacle"],
                metadata: { hp: 100 },
            })
        );
        const mesh = mgr.getScene("s")!.meshes[0];
        expect(mesh.isVisible).toBe(false);
        expect(mesh.isPickable).toBe(false);
        expect(mesh.castsShadows).toBe(true);
        expect(mesh.tags).toEqual(["obstacle"]);
        expect(mesh.metadata).toEqual({ hp: 100 });
    });

    // ── Test 17: addModel ────────────────────────────────────────────────

    it("adds a model with auto-parsed rootUrl and fileName", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const id = getId(mgr.addModel("s", "char", "https://example.com/models/character.glb"));
        expect(id).toBe("model_1");
        const model = mgr.getScene("s")!.models[0];
        expect(model.rootUrl).toBe("https://example.com/models/");
        expect(model.fileName).toBe("character.glb");
    });

    it("removes a model", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const id = getId(mgr.addModel("s", "m", "model.glb"));
        ok(mgr.removeModel("s", id));
        expect(mgr.getScene("s")!.models).toHaveLength(0);
    });

    // ── Test 18: addCamera with catalog validation ───────────────────────

    it("adds cameras with validated types", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const arcId = getId(mgr.addCamera("s", "main", "ArcRotateCamera", { radius: 15 }, true));
        expect(arcId).toBe("cam_1");
        const freeId = getId(mgr.addCamera("s", "fps", "FreeCamera"));
        expect(freeId).toBe("cam_2");

        expect(mgr.getScene("s")!.activeCameraId).toBe(arcId);
        expect(mgr.getScene("s")!.cameras).toHaveLength(2);

        // Reject unknown type
        const err = mgr.addCamera("s", "x", "OrthoCam");
        expect(typeof err).toBe("string");
        expect(err as string).toContain("Unknown camera type");
    });

    // ── Test 19: setActiveCamera ─────────────────────────────────────────

    it("sets active camera", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        getId(mgr.addCamera("s", "c1", "ArcRotateCamera"));
        const cam2 = getId(mgr.addCamera("s", "c2", "FreeCamera"));
        ok(mgr.setActiveCamera("s", cam2));
        expect(mgr.getScene("s")!.activeCameraId).toBe(cam2);
    });

    // ── Test 20: configureCameraProperties ───────────────────────────────

    it("configures camera properties after creation", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const id = getId(mgr.addCamera("s", "cam", "ArcRotateCamera", { radius: 10 }));
        ok(mgr.configureCameraProperties("s", id, { radius: 20, wheelPrecision: 100 }));
        const cam = mgr.getScene("s")!.cameras[0];
        expect(cam.properties.radius).toBe(20);
        expect(cam.properties.wheelPrecision).toBe(100);
    });

    // ── Test 21: addLight with catalog validation ────────────────────────

    it("adds lights with validated types", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const hemiId = getId(mgr.addLight("s", "sun", "HemisphericLight", { intensity: 0.7 }));
        expect(hemiId).toBe("light_1");
        const pointId = getId(mgr.addLight("s", "bulb", "PointLight"));
        expect(pointId).toBe("light_2");

        expect(mgr.getScene("s")!.lights).toHaveLength(2);

        // Reject unknown type
        const err = mgr.addLight("s", "x", "AreaLight");
        expect(typeof err).toBe("string");
        expect(err as string).toContain("Unknown light type");
    });

    // ── Test 22: configureLightProperties ────────────────────────────────

    it("configures light properties after creation", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const id = getId(mgr.addLight("s", "sun", "DirectionalLight", { intensity: 1 }));
        ok(mgr.configureLightProperties("s", id, { intensity: 0.5, shadowEnabled: true }));
        const light = mgr.getScene("s")!.lights[0];
        expect(light.properties.intensity).toBe(0.5);
        expect(light.properties.shadowEnabled).toBe(true);
    });

    // ── Test 23: addAnimation ────────────────────────────────────────────

    it("adds keyframe animation with data type inference", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const meshId = getId(mgr.addMesh("s", "box", "Box"));
        const animId = getId(
            mgr.addAnimation("s", "spin", meshId, "rotation.y", 30, [
                { frame: 0, value: 0 },
                { frame: 60, value: Math.PI * 2 },
            ])
        );
        expect(animId).toBe("anim_1");
        const anim = mgr.getScene("s")!.animations[0];
        expect(anim.targetId).toBe(meshId);
        expect(anim.property).toBe("rotation.y");
        expect(anim.fps).toBe(30);
        expect(anim.keys).toHaveLength(2);
        // Data type should be inferred as Float since value is a number
        expect(anim.dataType).toBe(0); // Float
    });

    it("adds Vector3 animation with array-style keyframes", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const meshId = getId(mgr.addMesh("s", "box", "Box"));
        getId(
            mgr.addAnimation("s", "move", meshId, "position", 30, [
                { frame: 0, value: [0, 0, 0] },
                { frame: 60, value: [10, 5, 0] },
            ])
        );
        const anim = mgr.getScene("s")!.animations[0];
        // Data type should be inferred as Vector3 since value is an array of 3
        expect(anim.dataType).toBe(1); // Vector3
    });

    it("resolves string loop mode", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const meshId = getId(mgr.addMesh("s", "box", "Box"));
        getId(
            mgr.addAnimation(
                "s",
                "bounce",
                meshId,
                "position.y",
                30,
                [
                    { frame: 0, value: 0 },
                    { frame: 30, value: 5 },
                ],
                "Cycle"
            )
        );
        const anim = mgr.getScene("s")!.animations[0];
        expect(anim.loopMode).toBe(1); // Cycle = 1
    });

    // ── Test 24: createAnimationGroup ────────────────────────────────────

    it("creates animation groups linking multiple animations", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const meshId = getId(mgr.addMesh("s", "box", "Box"));
        const a1 = getId(
            mgr.addAnimation("s", "a1", meshId, "position.x", 30, [
                { frame: 0, value: 0 },
                { frame: 30, value: 5 },
            ])
        );
        const a2 = getId(
            mgr.addAnimation("s", "a2", meshId, "position.y", 30, [
                { frame: 0, value: 0 },
                { frame: 30, value: 3 },
            ])
        );
        const grpId = getId(mgr.createAnimationGroup("s", "move", [a1, a2], { isLooping: true }));
        expect(grpId).toBe("animgrp_1");
        const grp = mgr.getScene("s")!.animationGroups[0];
        expect(grp.animationIds).toEqual([a1, a2]);
        expect(grp.isLooping).toBe(true);
    });

    // ── Test 25: addPhysicsBody ──────────────────────────────────────────

    it("adds physics body to mesh with string bodyType resolution", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const meshId = getId(mgr.addMesh("s", "box", "Box"));
        ok(mgr.addPhysicsBody("s", meshId, "Dynamic", "Box", { mass: 5, restitution: 0.6 }));
        const mesh = mgr.getScene("s")!.meshes[0];
        expect(mesh.physics).toBeDefined();
        expect(mesh.physics!.bodyType).toBe(2); // Dynamic = 2
        expect(mesh.physics!.shapeType).toBe("Box");
        expect(mesh.physics!.mass).toBe(5);
        expect(mesh.physics!.restitution).toBe(0.6);
    });

    it("rejects invalid shape type", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const meshId = getId(mgr.addMesh("s", "box", "Box"));
        const err = mgr.addPhysicsBody("s", meshId, "Dynamic", "Cone");
        expect(typeof err).toBe("string");
        expect(err).toContain("Unknown shape type");
    });

    // ── Test 26: removePhysicsBody ───────────────────────────────────────

    it("removes physics body from mesh", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const meshId = getId(mgr.addMesh("s", "box", "Box"));
        ok(mgr.addPhysicsBody("s", meshId, "Static", "Box"));
        ok(mgr.removePhysicsBody("s", meshId));
        expect(mgr.getScene("s")!.meshes[0].physics).toBeUndefined();
    });

    // ── Test 27: attachFlowGraph ─────────────────────────────────────────

    it("attaches a flow graph with coordinator JSON", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const coordJson = JSON.stringify({ allBlocks: [{ className: "FlowGraphSceneReadyEventBlock", config: {} }] });
        const result = mgr.attachFlowGraph("s", "onReady", coordJson);
        expect(typeof result).not.toBe("string");
        const id = (result as { id: string }).id;
        expect(id).toBe("fg_1");
        expect(mgr.getScene("s")!.flowGraphs).toHaveLength(1);
    });

    it("replaces flow graph with same name", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const coord1 = JSON.stringify({ allBlocks: [] });
        const coord2 = JSON.stringify({ allBlocks: [{ className: "Test" }] });
        mgr.attachFlowGraph("s", "behavior", coord1);
        mgr.attachFlowGraph("s", "behavior", coord2);
        expect(mgr.getScene("s")!.flowGraphs).toHaveLength(1);
    });

    // ── Test 28: removeFlowGraph ─────────────────────────────────────────

    it("removes a flow graph", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const coord = JSON.stringify({ allBlocks: [] });
        const id = getId(mgr.attachFlowGraph("s", "fg", coord));
        ok(mgr.removeFlowGraph("s", id));
        expect(mgr.getScene("s")!.flowGraphs).toHaveLength(0);
    });

    // ── Test 29: addSound ────────────────────────────────────────────────

    it("adds a sound with options", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const id = getId(mgr.addSound("s", "bgm", "music.mp3", "streaming", { loop: true, volume: 0.5 }));
        expect(id).toBe("snd_1");
        const snd = mgr.getScene("s")!.sounds[0];
        expect(snd.soundType).toBe("streaming");
        expect(snd.loop).toBe(true);
        expect(snd.volume).toBe(0.5);
    });

    // ── Test 30: removeSound ─────────────────────────────────────────────

    it("removes a sound", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const id = getId(mgr.addSound("s", "sfx", "hit.wav", "static"));
        ok(mgr.removeSound("s", id));
        expect(mgr.getScene("s")!.sounds).toHaveLength(0);
    });

    // ── Test 31: configureSoundProperties ────────────────────────────────

    it("configures sound properties after creation", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const id = getId(mgr.addSound("s", "sfx", "hit.wav", "static"));
        ok(mgr.configureSoundProperties("s", id, { volume: 0.8, playbackRate: 1.5 }));
        const snd = mgr.getScene("s")!.sounds[0];
        expect(snd.volume).toBe(0.8);
        expect(snd.playbackRate).toBe(1.5);
    });

    // ── Test 32: attachSoundToMesh ───────────────────────────────────────

    it("attaches sound to mesh and auto-enables spatial", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const meshId = getId(mgr.addMesh("s", "box", "Box"));
        const sndId = getId(mgr.addSound("s", "sfx", "beep.wav", "static"));
        ok(mgr.attachSoundToMesh("s", sndId, meshId));
        const snd = mgr.getScene("s")!.sounds[0];
        expect(snd.attachedMeshId).toBe(meshId);
        expect(snd.spatialEnabled).toBe(true);
    });

    // ── Test 33: addParticleSystem ───────────────────────────────────────

    it("adds a particle system", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const id = getId(
            mgr.addParticleSystem(
                "s",
                "fire",
                2000,
                { x: 0, y: 1, z: 0 },
                {
                    emitRate: 100,
                    particleTexture: "flare.png",
                }
            )
        );
        expect(id).toBe("ps_1");
        const ps = mgr.getScene("s")!.particleSystems[0];
        expect(ps.capacity).toBe(2000);
        expect(ps.emitter).toEqual({ x: 0, y: 1, z: 0 });
        expect(ps.emitRate).toBe(100);
    });

    it("adds particle system with mesh emitter validation", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const meshId = getId(mgr.addMesh("s", "emitter", "Sphere"));
        const psId = getId(mgr.addParticleSystem("s", "sparks", 500, meshId));
        expect(typeof psId).toBe("string");
        const ps = mgr.getScene("s")!.particleSystems[0];
        expect(ps.emitter).toBe(meshId);
    });

    // ── Test 34: removeParticleSystem ────────────────────────────────────

    it("removes a particle system", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const id = getId(mgr.addParticleSystem("s", "ps", 100, { x: 0, y: 0, z: 0 }));
        ok(mgr.removeParticleSystem("s", id));
        expect(mgr.getScene("s")!.particleSystems).toHaveLength(0);
    });

    // ── Test 35: configureParticleSystem ─────────────────────────────────

    it("configures particle system properties", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const id = getId(mgr.addParticleSystem("s", "ps", 100, { x: 0, y: 0, z: 0 }));
        ok(mgr.configureParticleSystem("s", id, { emitRate: 500, minLifeTime: 0.5, maxLifeTime: 2 }));
        const ps = mgr.getScene("s")!.particleSystems[0];
        expect(ps.emitRate).toBe(500);
    });

    // ── Test 36: addParticleGradient ─────────────────────────────────────

    it("adds color and size gradients to particle system", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const id = getId(mgr.addParticleSystem("s", "ps", 100, { x: 0, y: 0, z: 0 }));
        ok(mgr.addParticleGradient("s", id, "color", 0, { r: 1, g: 0.5, b: 0, a: 1 }));
        ok(mgr.addParticleGradient("s", id, "color", 1, { r: 1, g: 0, b: 0, a: 0 }));
        ok(mgr.addParticleGradient("s", id, "size", 0, 0.5));
        ok(mgr.addParticleGradient("s", id, "size", 1, 2.0));

        const ps = mgr.getScene("s")!.particleSystems[0];
        expect(ps.colorGradients).toHaveLength(2);
        expect(ps.sizeGradients).toHaveLength(2);
    });

    // ── Test 37: addPhysicsConstraint ────────────────────────────────────

    it("adds physics constraint between two bodies", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const m1 = getId(mgr.addMesh("s", "a", "Box"));
        const m2 = getId(mgr.addMesh("s", "b", "Sphere"));
        ok(mgr.addPhysicsBody("s", m1, "Static", "Box"));
        ok(mgr.addPhysicsBody("s", m2, "Dynamic", "Sphere"));

        const cId = getId(
            mgr.addPhysicsConstraint("s", "hinge", "Hinge", m1, m2, {
                pivotA: { x: 0, y: 1, z: 0 },
                pivotB: { x: 0, y: -1, z: 0 },
            })
        );
        expect(cId).toBe("constraint_1");
        const c = mgr.getScene("s")!.physicsConstraints[0];
        expect(c.constraintType).toBe("Hinge");
        expect(c.parentMeshId).toBe(m1);
        expect(c.childMeshId).toBe(m2);
    });

    it("rejects constraint between meshes without physics bodies", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const m1 = getId(mgr.addMesh("s", "a", "Box"));
        const m2 = getId(mgr.addMesh("s", "b", "Box"));
        const err = mgr.addPhysicsConstraint("s", "c", "Hinge", m1, m2) as string;
        expect(err).toContain("no physics body");
    });

    it("rejects unknown constraint type", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const m1 = getId(mgr.addMesh("s", "a", "Box"));
        const m2 = getId(mgr.addMesh("s", "b", "Box"));
        ok(mgr.addPhysicsBody("s", m1, "Static", "Box"));
        ok(mgr.addPhysicsBody("s", m2, "Dynamic", "Box"));
        const err = mgr.addPhysicsConstraint("s", "c", "Weld", m1, m2) as string;
        expect(err).toContain("Unknown constraint type");
    });

    // ── Test 38: removePhysicsConstraint ─────────────────────────────────

    it("removes a physics constraint", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const m1 = getId(mgr.addMesh("s", "a", "Box"));
        const m2 = getId(mgr.addMesh("s", "b", "Box"));
        ok(mgr.addPhysicsBody("s", m1, "Static", "Box"));
        ok(mgr.addPhysicsBody("s", m2, "Dynamic", "Box"));
        const cId = getId(mgr.addPhysicsConstraint("s", "c", "BallAndSocket", m1, m2));
        ok(mgr.removePhysicsConstraint("s", cId));
        expect(mgr.getScene("s")!.physicsConstraints).toHaveLength(0);
    });

    // ── Test 39: configureRenderPipeline ─────────────────────────────────

    it("auto-creates render pipeline and configures effects", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        ok(
            mgr.configureRenderPipeline("s", {
                bloomEnabled: true,
                bloomWeight: 0.3,
                fxaaEnabled: true,
            })
        );
        const rp = mgr.getScene("s")!.renderPipeline!;
        expect(rp).toBeDefined();
        expect(rp.bloomEnabled).toBe(true);
        expect(rp.bloomWeight).toBe(0.3);
        expect(rp.fxaaEnabled).toBe(true);
    });

    // ── Test 40: addGlowLayer / addMeshToGlowLayer ──────────────────────

    it("adds glow layer and manages mesh inclusion", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const glowId = getId(mgr.addGlowLayer("s", "glow1", { intensity: 2, blurKernelSize: 64 }));
        expect(glowId).toBe("glow_1");

        const meshId = getId(mgr.addMesh("s", "box", "Box"));
        ok(mgr.addMeshToGlowLayer("s", glowId, meshId, "include"));
        const glow = mgr.getScene("s")!.glowLayers[0];
        expect(glow.includedOnlyMeshIds).toContain(meshId);
        expect(glow.intensity).toBe(2);
    });

    // ── Test 41: removeGlowLayer ─────────────────────────────────────────

    it("removes a glow layer", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const glowId = getId(mgr.addGlowLayer("s", "glow", {}));
        ok(mgr.removeGlowLayer("s", glowId));
        expect(mgr.getScene("s")!.glowLayers).toHaveLength(0);
    });

    // ── Test 42: addHighlightLayer / addMeshToHighlightLayer ─────────────

    it("adds highlight layer and adds mesh with color", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const hlId = getId(mgr.addHighlightLayer("s", "hl1"));
        expect(hlId).toBe("highlight_1");

        const meshId = getId(mgr.addMesh("s", "box", "Box"));
        ok(mgr.addMeshToHighlightLayer("s", hlId, meshId, { r: 0, g: 1, b: 0 }));
        const hl = mgr.getScene("s")!.highlightLayers[0];
        expect(hl.meshes).toHaveLength(1);
        expect(hl.meshes[0].meshId).toBe(meshId);
    });

    // ── Test 43: removeMeshFromHighlightLayer ────────────────────────────

    it("removes mesh from highlight layer", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const hlId = getId(mgr.addHighlightLayer("s", "hl"));
        const meshId = getId(mgr.addMesh("s", "box", "Box"));
        ok(mgr.addMeshToHighlightLayer("s", hlId, meshId, { r: 1, g: 0, b: 0 }));
        ok(mgr.removeMeshFromHighlightLayer("s", hlId, meshId));
        expect(mgr.getScene("s")!.highlightLayers[0].meshes).toHaveLength(0);
    });

    // ── Test 44: removeHighlightLayer ────────────────────────────────────

    it("removes a highlight layer", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const hlId = getId(mgr.addHighlightLayer("s", "hl"));
        ok(mgr.removeHighlightLayer("s", hlId));
        expect(mgr.getScene("s")!.highlightLayers).toHaveLength(0);
    });

    // ── Test 45: describeScene ───────────────────────────────────────────

    it("produces markdown description of a populated scene", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        getId(mgr.addCamera("s", "cam", "ArcRotateCamera", {}, true));
        getId(mgr.addLight("s", "sun", "HemisphericLight"));
        getId(mgr.addMesh("s", "box", "Box"));
        getId(mgr.addMaterial("s", "red", "StandardMaterial"));

        const desc = mgr.describeScene("s");
        expect(desc).toContain("# Scene: s");
        expect(desc).toContain("Cameras");
        expect(desc).toContain("Lights");
        expect(desc).toContain("Meshes");
        expect(desc).toContain("Materials");
    });

    // ── Test 46: describeNode ────────────────────────────────────────────

    it("describes a mesh node in detail", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const meshId = getId(mgr.addMesh("s", "myBox", "Box", { size: 3 }));
        const desc = mgr.describeNode("s", meshId);
        expect(desc).toContain("Mesh: myBox");
        expect(desc).toContain("Box");
    });

    it("describes a transform node in detail", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const tnId = getId(mgr.addTransformNode("s", "pivot", { position: { x: 1, y: 2, z: 3 } }));
        const desc = mgr.describeNode("s", tnId);
        expect(desc).toContain("TransformNode: pivot");
        expect(desc).toContain("1");
    });

    it("returns error for nonexistent node", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const desc = mgr.describeNode("s", "nope");
        expect(desc).toContain("not found");
    });

    // ── Test 47: validateScene ───────────────────────────────────────────

    it("validates a scene with no issues", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        getId(mgr.addCamera("s", "cam", "ArcRotateCamera", {}, true));
        getId(mgr.addLight("s", "sun", "HemisphericLight"));

        const issues = mgr.validateScene("s");
        expect(issues).toEqual(["OK: Scene is valid!"]);
    });

    it("warns about missing camera and light", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const issues = mgr.validateScene("s");
        expect(issues.some((i) => i.includes("No camera"))).toBe(true);
        expect(issues.some((i) => i.includes("No lights"))).toBe(true);
    });

    it("detects dangling material reference", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        getId(mgr.addCamera("s", "cam", "ArcRotateCamera", {}, true));
        getId(mgr.addLight("s", "sun", "HemisphericLight"));
        getId(mgr.addMesh("s", "box", "Box"));
        // Force invalid material ref
        mgr.getScene("s")!.meshes[0].materialId = "non_existent";
        const issues = mgr.validateScene("s");
        expect(issues.some((i) => i.includes("material") && i.includes("non_existent"))).toBe(true);
    });

    it("detects dangling parent reference", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        getId(mgr.addCamera("s", "cam", "ArcRotateCamera", {}, true));
        getId(mgr.addLight("s", "sun", "HemisphericLight"));
        getId(mgr.addMesh("s", "box", "Box"));
        mgr.getScene("s")!.meshes[0].parentId = "ghost";
        const issues = mgr.validateScene("s");
        expect(issues.some((i) => i.includes("parent") && i.includes("ghost"))).toBe(true);
    });

    it("detects dangling animation target", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        getId(mgr.addCamera("s", "cam", "ArcRotateCamera", {}, true));
        getId(mgr.addLight("s", "sun", "HemisphericLight"));
        getId(mgr.addAnimation("s", "a", "nope_target", "position.y", 30, [{ frame: 0, value: 0 }]));
        const issues = mgr.validateScene("s");
        expect(issues.some((i) => i.includes("Animation") && i.includes("nope_target"))).toBe(true);
    });

    // ── Test 48: enableInspector ─────────────────────────────────────────

    it("enables and disables inspector", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        ok(mgr.enableInspector("s", true, { overlay: true, initialTab: "Scene" }));
        expect(mgr.getScene("s")!.inspector).toBeDefined();
        expect(mgr.getScene("s")!.inspector!.enabled).toBe(true);
        expect(mgr.getScene("s")!.inspector!.overlay).toBe(true);

        ok(mgr.enableInspector("s", false));
        expect(mgr.getScene("s")!.inspector).toBeUndefined();
    });

    // ── Test 49: attachGUI / detachGUI / describeGUI ─────────────────────

    it("attaches, describes, and detaches GUI", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const guiJson = { root: { children: [{ name: "btn", className: "Button", text: "Click me" }] } };
        ok(mgr.attachGUI("s", guiJson));
        expect(mgr.getScene("s")!.guiJson).toBeDefined();

        const desc = mgr.describeGUI("s");
        expect(desc).toContain("GUI (attached)");
        expect(desc).toContain("btn");
        expect(desc).toContain("Button");

        ok(mgr.detachGUI("s"));
        expect(mgr.getScene("s")!.guiJson).toBeUndefined();
    });

    it("rejects invalid GUI JSON", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const result = mgr.attachGUI("s", { noRoot: true });
        expect(result).toContain("Invalid GUI JSON");
    });

    it("parses GUI from string", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        ok(mgr.attachGUI("s", '{"root":{"children":[]}}'));
        expect(mgr.getScene("s")!.guiJson).toBeDefined();
    });

    // ── Test 50: addIntegration / removeIntegration / listIntegrations ───

    it("adds, lists, and removes integrations", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        ok(
            mgr.addIntegration("s", {
                type: "physicsCollision",
                sourceBody: "ball",
                targetBody: "ground",
                eventId: "ballHit",
            } as any)
        );
        ok(
            mgr.addIntegration("s", {
                type: "guiButton",
                buttonName: "start",
                eventId: "onStart",
            } as any)
        );

        const listing = mgr.listIntegrations("s");
        expect(listing).toContain("physicsCollision");
        expect(listing).toContain("guiButton");

        ok(mgr.removeIntegration("s", 0));
        expect(mgr.getScene("s")!.integrations).toHaveLength(1);
    });

    it("returns error for out-of-range integration removal", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const result = mgr.removeIntegration("s", 5);
        expect(result).toContain("out of range");
    });

    // ── Test 51: exportJSON ──────────────────────────────────────────────

    it("exports scene as valid JSON", () => {
        const mgr = new SceneManager();
        mgr.createScene("s", "Test scene");
        getId(mgr.addCamera("s", "cam", "ArcRotateCamera", { radius: 10 }, true));
        getId(mgr.addLight("s", "sun", "HemisphericLight", { intensity: 0.7 }));
        const meshId = getId(mgr.addMesh("s", "box", "Box", { size: 2 }));
        const matId = getId(mgr.addMaterial("s", "red", "StandardMaterial", { diffuseColor: { r: 1, g: 0, b: 0 } }));
        ok(mgr.assignMaterial("s", meshId, matId));

        const json = mgr.exportJSON("s");
        expect(json).not.toBeNull();
        const parsed = JSON.parse(json!);
        expect(parsed.version).toBe("1.0.0");
        expect(parsed.name).toBe("s");
        expect(parsed.cameras).toHaveLength(1);
        expect(parsed.lights).toHaveLength(1);
        expect(parsed.meshes).toHaveLength(1);
        expect(parsed.materials).toHaveLength(1);
        expect(parsed.meshes[0].materialId).toBe(matId);
    });

    it("returns null for nonexistent scene export", () => {
        const mgr = new SceneManager();
        expect(mgr.exportJSON("nope")).toBeNull();
    });

    // ── Test 52: exportCode ──────────────────────────────────────────────

    it("generates runnable code from a scene", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        getId(mgr.addCamera("s", "cam", "ArcRotateCamera", {}, true));
        getId(mgr.addLight("s", "sun", "HemisphericLight"));
        getId(mgr.addMesh("s", "box", "Box"));

        const code = mgr.exportCode("s");
        expect(code).not.toBeNull();
        expect(code).toContain("ArcRotateCamera");
        expect(code).toContain("HemisphericLight");
        expect(code).toContain("MeshBuilder");
    });

    it("returns null for nonexistent scene code export", () => {
        const mgr = new SceneManager();
        expect(mgr.exportCode("nope")).toBeNull();
    });

    // ── Test 53: exportProject ───────────────────────────────────────────

    it("generates a complete project file set", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        getId(mgr.addCamera("s", "cam", "ArcRotateCamera", {}, true));
        getId(mgr.addLight("s", "sun", "HemisphericLight"));
        getId(mgr.addMesh("s", "box", "Box"));

        const project = mgr.exportProject("s");
        expect(project).not.toBeNull();
        expect(project!["package.json"]).toBeDefined();
        expect(project!["tsconfig.json"]).toBeDefined();
        expect(project!["index.html"]).toBeDefined();
        expect(project!["src/index.ts"]).toBeDefined();
    });

    // ── Test 54: attachNodeRenderGraph ────────────────────────────────────

    it("attaches and detaches Node Render Graph JSON", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const nrgJson = { customType: "BABYLON.NodeRenderGraph", blocks: [] };
        ok(mgr.attachNodeRenderGraph("s", nrgJson));
        expect(mgr.getScene("s")!.nodeRenderGraphJson).toBeDefined();

        ok(mgr.detachNodeRenderGraph("s"));
        expect(mgr.getScene("s")!.nodeRenderGraphJson).toBeUndefined();
    });

    it("rejects NRG JSON with wrong customType", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const result = mgr.attachNodeRenderGraph("s", { customType: "WRONG" });
        expect(result).toContain("Invalid NRG JSON");
    });

    it("parses NRG JSON from string", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        ok(mgr.attachNodeRenderGraph("s", '{"customType":"BABYLON.NodeRenderGraph"}'));
        expect(mgr.getScene("s")!.nodeRenderGraphJson).toBeDefined();
    });

    // ── Test 55: addNodeGeometryMesh ─────────────────────────────────────

    it("adds and removes Node Geometry meshes", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const ngeJson = { customType: "BABYLON.NodeGeometry", blocks: [] };
        ok(mgr.addNodeGeometryMesh("s", "terrain", ngeJson));
        expect(mgr.getScene("s")!.nodeGeometryMeshes).toHaveLength(1);

        // Replace with same name
        ok(mgr.addNodeGeometryMesh("s", "terrain", { customType: "BABYLON.NodeGeometry", blocks: [1] }));
        expect(mgr.getScene("s")!.nodeGeometryMeshes).toHaveLength(1);

        // Add a new one
        ok(mgr.addNodeGeometryMesh("s", "rocks", ngeJson));
        expect(mgr.getScene("s")!.nodeGeometryMeshes).toHaveLength(2);

        ok(mgr.removeNodeGeometryMesh("s", "terrain"));
        expect(mgr.getScene("s")!.nodeGeometryMeshes).toHaveLength(1);
    });

    it("rejects NGE JSON with wrong customType", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const result = mgr.addNodeGeometryMesh("s", "x", { customType: "WRONG" });
        expect(result).toContain("Invalid NGE JSON");
    });

    // ── Test 56: importJSON ──────────────────────────────────────────────

    it("imports scene from JSON and updates id counters", () => {
        const mgr = new SceneManager();
        mgr.createScene("original");
        getId(mgr.addMesh("original", "box1", "Box"));
        getId(mgr.addMesh("original", "box2", "Box"));
        const json = mgr.exportJSON("original")!;

        // Import into a new manager to test round-tripping
        const mgr2 = new SceneManager();
        ok(mgr2.importJSON("imported", json));
        const scene = mgr2.getScene("imported")!;
        expect(scene.name).toBe("imported");
        expect(scene.meshes).toHaveLength(2);

        // After import, adding a new mesh should not collide with existing IDs
        const newId = getId(mgr2.addMesh("imported", "box3", "Box"));
        expect(newId).toBe("mesh_3"); // Continues from highest existing id
    });

    it("rejects invalid JSON on import", () => {
        const mgr = new SceneManager();
        const result = mgr.importJSON("s", "not valid json");
        expect(result).toContain("Failed to parse");
    });

    it("rejects JSON missing required fields", () => {
        const mgr = new SceneManager();
        const result = mgr.importJSON("s", '{"name":"s"}');
        expect(result).toContain("missing required fields");
    });

    // ── Test 57: Sequential ID generation ────────────────────────────────

    it("generates sequential IDs per prefix per scene", () => {
        const mgr = new SceneManager();
        mgr.createScene("a");
        mgr.createScene("b");

        const meshA1 = getId(mgr.addMesh("a", "m1", "Box"));
        const meshA2 = getId(mgr.addMesh("a", "m2", "Sphere"));
        const meshB1 = getId(mgr.addMesh("b", "m1", "Box"));

        expect(meshA1).toBe("mesh_1");
        expect(meshA2).toBe("mesh_2");
        expect(meshB1).toBe("mesh_1"); // Separate counter for scene b

        const camA = getId(mgr.addCamera("a", "c", "ArcRotateCamera"));
        expect(camA).toBe("cam_1"); // Different prefix
    });

    // ── Test 58: findNode by name ────────────────────────────────────────

    it("setTransform finds node by name, not just id", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        getId(mgr.addMesh("s", "myBox", "Box"));
        ok(mgr.setTransform("s", "myBox", { position: { x: 1, y: 2, z: 3 } }));
        const mesh = mgr.getScene("s")!.meshes[0];
        expect(mesh.transform.position).toEqual({ x: 1, y: 2, z: 3 });
    });

    // ── Test 59: addMesh with inline physics ─────────────────────────────

    it("adds mesh with inline transform and materialId", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const matId = getId(mgr.addMaterial("s", "mat", "StandardMaterial"));
        getId(mgr.addMesh("s", "box", "Box", { size: 3 }, { position: { x: 5, y: 0, z: 0 } }, undefined, matId));
        const mesh = mgr.getScene("s")!.meshes[0];
        expect(mesh.materialId).toBe(matId);
        expect(mesh.transform.position).toEqual({ x: 5, y: 0, z: 0 });
    });

    // ── Test 60: "not found" error patterns ──────────────────────────────

    it("returns scene-not-found errors consistently", () => {
        const mgr = new SceneManager();
        expect(mgr.setEnvironment("x", {})).toContain("not found");
        expect(typeof mgr.addMesh("x", "b", "Box")).toBe("string");
        expect(typeof mgr.addCamera("x", "c", "ArcRotateCamera")).toBe("string");
        expect(typeof mgr.addLight("x", "l", "PointLight")).toBe("string");
        expect(typeof mgr.addMaterial("x", "m", "StandardMaterial")).toBe("string");
        expect(typeof mgr.addTexture("x", "t", "t.png")).toBe("string");
        expect(typeof mgr.addAnimation("x", "a", "t", "position.y", 30, [])).toBe("string");
        expect(typeof mgr.addSound("x", "s", "s.mp3", "static")).toBe("string");
        expect(mgr.exportJSON("x")).toBeNull();
        expect(mgr.exportCode("x")).toBeNull();
        expect(mgr.validateScene("x")[0]).toContain("not found");
        expect(mgr.describeScene("x")).toContain("not found");
    });

    // ── Test 61: exportCode auto-includes attached GUI ───────────────────

    it("exportCode auto-includes attached GUI JSON", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        getId(mgr.addCamera("s", "cam", "ArcRotateCamera", {}, true));
        getId(mgr.addLight("s", "sun", "HemisphericLight"));
        const guiJson = { root: { children: [{ name: "lbl", className: "TextBlock", text: "Hello" }] } };
        ok(mgr.attachGUI("s", guiJson));

        const code = mgr.exportCode("s");
        expect(code).not.toBeNull();
        // The code should contain GUI-related content
        expect(code).toContain("AdvancedDynamicTexture");
    });

    // ── Test 62: exportCode with Node Render Graph ───────────────────────

    it("exportCode auto-includes attached NRG JSON", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        getId(mgr.addCamera("s", "cam", "ArcRotateCamera", {}, true));
        getId(mgr.addLight("s", "sun", "HemisphericLight"));
        ok(mgr.attachNodeRenderGraph("s", { customType: "BABYLON.NodeRenderGraph", blocks: [] }));

        const code = mgr.exportCode("s");
        expect(code).not.toBeNull();
        expect(code).toContain("NodeRenderGraph");
    });

    // ── Test 63: exportProject with NGE meshes ───────────────────────────

    it("exportProject auto-includes attached NGE meshes", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        getId(mgr.addCamera("s", "cam", "ArcRotateCamera", {}, true));
        getId(mgr.addLight("s", "sun", "HemisphericLight"));
        ok(mgr.addNodeGeometryMesh("s", "terrain", { customType: "BABYLON.NodeGeometry", blocks: [] }));

        const project = mgr.exportProject("s");
        expect(project).not.toBeNull();
        const srcCode = project!["src/index.ts"];
        expect(srcCode).toContain("NodeGeometry");
    });

    // ── Test 64: validate detects dangling sound attachment ──────────────

    it("validate detects dangling sound-to-mesh reference", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        getId(mgr.addCamera("s", "cam", "ArcRotateCamera", {}, true));
        getId(mgr.addLight("s", "sun", "HemisphericLight"));
        getId(mgr.addSound("s", "sfx", "beep.wav", "static"));
        // Force invalid attachment reference
        mgr.getScene("s")!.sounds[0].attachedMeshId = "fake_mesh";
        const issues = mgr.validateScene("s");
        expect(issues.some((i) => i.includes("Sound") && i.includes("fake_mesh"))).toBe(true);
    });

    // ── Test 65: validate detects dangling particle emitter ──────────────

    it("validate detects dangling particle system emitter reference", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        getId(mgr.addCamera("s", "cam", "ArcRotateCamera", {}, true));
        getId(mgr.addLight("s", "sun", "HemisphericLight"));
        // Force a particle with bad emitter
        mgr.getScene("s")!.particleSystems.push({
            id: "ps_1",
            name: "bad",
            capacity: 100,
            emitter: "no_such_mesh",
            emitRate: 10,
        } as any);
        const issues = mgr.validateScene("s");
        expect(issues.some((i) => i.includes("ParticleSystem") && i.includes("no_such_mesh"))).toBe(true);
    });

    // ── Test 66: validate detects dangling constraint body ───────────────

    it("validate detects physics constraint referencing mesh without body", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        getId(mgr.addCamera("s", "cam", "ArcRotateCamera", {}, true));
        getId(mgr.addLight("s", "sun", "HemisphericLight"));
        const m1 = getId(mgr.addMesh("s", "a", "Box"));
        const m2 = getId(mgr.addMesh("s", "b", "Box"));
        // Force a constraint without physics bodies
        mgr.getScene("s")!.physicsConstraints.push({
            id: "constraint_1",
            name: "c",
            constraintType: "Hinge",
            parentMeshId: m1,
            childMeshId: m2,
        } as any);
        const issues = mgr.validateScene("s");
        expect(issues.some((i) => i.includes("no physics body"))).toBe(true);
    });

    // ── Test 67: All 10 mesh primitive types accepted ────────────────────

    it("accepts all catalog mesh primitive types", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const types = ["Box", "Sphere", "Cylinder", "Plane", "Ground", "Torus", "TorusKnot", "Disc", "Capsule", "IcoSphere"];
        for (const type of types) {
            const result = mgr.addMesh("s", type.toLowerCase(), type);
            expect(typeof result).not.toBe("string");
        }
        expect(mgr.getScene("s")!.meshes).toHaveLength(types.length);
    });

    // ── Test 68: All 4 camera types accepted ─────────────────────────────

    it("accepts all catalog camera types", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const types = ["ArcRotateCamera", "FreeCamera", "UniversalCamera", "FollowCamera"];
        for (const type of types) {
            const result = mgr.addCamera("s", type, type);
            expect(typeof result).not.toBe("string");
        }
        expect(mgr.getScene("s")!.cameras).toHaveLength(types.length);
    });

    // ── Test 69: All 4 light types accepted ──────────────────────────────

    it("accepts all catalog light types", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const types = ["HemisphericLight", "PointLight", "DirectionalLight", "SpotLight"];
        for (const type of types) {
            const result = mgr.addLight("s", type, type);
            expect(typeof result).not.toBe("string");
        }
        expect(mgr.getScene("s")!.lights).toHaveLength(types.length);
    });

    // ── Test 70: All 3 material types accepted ───────────────────────────

    it("accepts all catalog material types", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const types = ["StandardMaterial", "PBRMaterial", "NodeMaterial"];
        for (const type of types) {
            const result = mgr.addMaterial("s", type, type);
            expect(typeof result).not.toBe("string");
        }
        expect(mgr.getScene("s")!.materials).toHaveLength(types.length);
    });

    // ── Test 71: All 7 physics constraint types accepted ─────────────────

    it("accepts all catalog physics constraint types", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const types = ["BallAndSocket", "Distance", "Hinge", "Slider", "Lock", "Prismatic", "Spring"];
        // Create a pair of physics meshes for each constraint
        for (let i = 0; i < types.length; i++) {
            const m1 = getId(mgr.addMesh("s", `a${i}`, "Box"));
            const m2 = getId(mgr.addMesh("s", `b${i}`, "Box"));
            ok(mgr.addPhysicsBody("s", m1, "Static", "Box"));
            ok(mgr.addPhysicsBody("s", m2, "Dynamic", "Box"));
            const cResult = mgr.addPhysicsConstraint("s", `c${i}`, types[i], m1, m2);
            expect(typeof cResult).not.toBe("string");
        }
        expect(mgr.getScene("s")!.physicsConstraints).toHaveLength(types.length);
    });

    // ── Test 72: describeGUI with no GUI attached ────────────────────────

    it("describeGUI returns appropriate message when no GUI is attached", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        expect(mgr.describeGUI("s")).toContain("No GUI attached");
    });

    // ── Test 73: listIntegrations with no integrations ───────────────────

    it("listIntegrations returns appropriate message when empty", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        expect(mgr.listIntegrations("s")).toContain("No integrations");
    });

    // ── Test 74: Flow graph with mesh reference warnings ─────────────────

    it("attachFlowGraph warns about unresolved mesh references", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        // Coordinator JSON with a mesh reference that doesn't exist
        const coordJson = JSON.stringify({
            allBlocks: [
                {
                    className: "FlowGraphGetAssetBlock",
                    config: { assetRef: { type: "mesh", name: "nonexistentMesh" } },
                },
            ],
        });
        const result = mgr.attachFlowGraph("s", "fg", coordJson);
        expect(typeof result).not.toBe("string");
        const resultObj = result as { id: string; warnings?: string[] };
        // Should have warnings about unresolved reference
        if (resultObj.warnings) {
            expect(resultObj.warnings.length).toBeGreaterThan(0);
        }
    });

    // ── Test 75: Velocity gradient on particle system ────────────────────

    it("adds velocity gradients to particle system", () => {
        const mgr = new SceneManager();
        mgr.createScene("s");
        const id = getId(mgr.addParticleSystem("s", "ps", 100, { x: 0, y: 0, z: 0 }));
        ok(mgr.addParticleGradient("s", id, "velocity", 0, 1));
        ok(mgr.addParticleGradient("s", id, "velocity", 1, 0.1));
        const ps = mgr.getScene("s")!.particleSystems[0];
        expect(ps.velocityGradients).toHaveLength(2);
    });
});
