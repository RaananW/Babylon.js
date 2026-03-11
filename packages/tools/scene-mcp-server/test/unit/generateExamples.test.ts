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

function validateGeneratedCode(code: string): void {
    expect(code.length).toBeGreaterThan(100);
    // Every scene must create a Scene
    expect(code).toContain("Scene");
}

function validateProjectFiles(files: Record<string, string>): void {
    expect(files["package.json"]).toBeDefined();
    expect(files["src/index.ts"]).toBeDefined();
    expect(files["index.html"]).toBeDefined();
    // package.json should reference babylonjs
    const pkg = JSON.parse(files["package.json"]);
    expect(pkg.dependencies).toBeDefined();
}

describe("Scene MCP Server – Example Generation", () => {
    beforeAll(() => {
        fs.mkdirSync(EXAMPLES_DIR, { recursive: true });
    });

    // ── Example 1: Basic Scene (UMD code) ────────────────────────────────

    it("Example 1: BasicScene – generates UMD code with camera, light, box", () => {
        const mgr = new SceneManager();
        mgr.createScene("BasicScene", "A simple scene with a camera, light, and textured box");

        // Camera
        const camId = getId(mgr.addCamera("BasicScene", "mainCam", "ArcRotateCamera"));
        ok(mgr.configureCameraProperties("BasicScene", camId, { alpha: 1.5, beta: 1.2, radius: 10 }));
        ok(mgr.setActiveCamera("BasicScene", camId));

        // Light
        const lightId = getId(mgr.addLight("BasicScene", "sun", "HemisphericLight"));
        ok(mgr.configureLightProperties("BasicScene", lightId, { intensity: 0.8 }));

        // Material
        const matId = getId(mgr.addMaterial("BasicScene", "boxMat", "PBRMaterial"));
        ok(mgr.configureMaterialProperties("BasicScene", matId, { albedoColor: { r: 0.8, g: 0.2, b: 0.2 } }));

        // Mesh
        const boxId = getId(mgr.addMesh("BasicScene", "box1", "Box", { size: 2 }));
        ok(mgr.assignMaterial("BasicScene", boxId, matId));

        // Ground
        getId(mgr.addMesh("BasicScene", "ground", "Ground", { width: 10, height: 10 }));

        // Validate scene
        const issues = mgr.validateScene("BasicScene");
        expect(issues.filter((i: string) => i.startsWith("ERROR"))).toHaveLength(0);

        // Export UMD code (standalone HTML page)
        const code = mgr.exportCode("BasicScene", {
            format: "umd",
            includeHtmlBoilerplate: true,
            includeEngineSetup: true,
            includeRenderLoop: true,
        })!;
        validateGeneratedCode(code);
        expect(code).toContain("BABYLON");
        expect(code).toContain("ArcRotateCamera");
        expect(code).toContain("HemisphericLight");
        expect(code).toContain("MeshBuilder.CreateBox");
        expect(code).toContain("PBRMaterial");
        expect(code).toContain("MeshBuilder.CreateGround");

        fs.writeFileSync(path.join(EXAMPLES_DIR, "BasicScene.html"), code);
    });

    // ── Example 2: Physics Playground (ES6 project) ──────────────────────

    it("Example 2: PhysicsPlayground – generates ES6 project with physics", () => {
        const mgr = new SceneManager();
        mgr.createScene("PhysicsPlayground", "A physics-enabled scene with dynamic bodies and constraints");

        ok(mgr.setEnvironment("PhysicsPlayground", { physicsEnabled: true, gravity: { x: 0, y: -9.81, z: 0 } }));

        const camId = getId(mgr.addCamera("PhysicsPlayground", "cam", "ArcRotateCamera"));
        ok(mgr.setActiveCamera("PhysicsPlayground", camId));
        getId(mgr.addLight("PhysicsPlayground", "light", "HemisphericLight"));

        const groundId = getId(mgr.addMesh("PhysicsPlayground", "ground", "Ground", { width: 20, height: 20 }));
        ok(mgr.addPhysicsBody("PhysicsPlayground", groundId, "Static", "Box", { mass: 0 }));

        const box1 = getId(mgr.addMesh("PhysicsPlayground", "box1", "Box", { size: 1 }, { position: { x: 0, y: 5, z: 0 } }));
        ok(mgr.addPhysicsBody("PhysicsPlayground", box1, "Dynamic", "Box", { mass: 1, restitution: 0.5 }));

        const sphere1 = getId(mgr.addMesh("PhysicsPlayground", "sphere1", "Sphere", { diameter: 1 }, { position: { x: 2, y: 8, z: 0 } }));
        ok(mgr.addPhysicsBody("PhysicsPlayground", sphere1, "Dynamic", "Sphere", { mass: 2, restitution: 0.7 }));

        getId(
            mgr.addPhysicsConstraint("PhysicsPlayground", "hinge1", "Hinge", box1, sphere1, {
                pivotA: { x: 0.5, y: 0, z: 0 },
                pivotB: { x: -0.5, y: 0, z: 0 },
            })
        );

        const issues = mgr.validateScene("PhysicsPlayground");
        expect(issues.filter((i: string) => i.startsWith("ERROR"))).toHaveLength(0);

        // Export full ES6 project
        const project = mgr.exportProject("PhysicsPlayground", { format: "es6" })!;
        validateProjectFiles(project);

        const srcCode = project["src/index.ts"];
        expect(srcCode).toContain("HavokPhysics");
        expect(srcCode).toContain("PhysicsBody");
        expect(srcCode).toContain("Physics6DoFConstraint");

        // Write project files
        const projectDir = path.join(EXAMPLES_DIR, "PhysicsPlayground");
        for (const [relativePath, content] of Object.entries(project)) {
            const filePath = path.join(projectDir, relativePath);
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
            fs.writeFileSync(filePath, content);
        }
    });

    // ── Example 3: Animated Scene (ES6 code) ─────────────────────────────

    it("Example 3: AnimatedScene – generates ES6 code with animations", () => {
        const mgr = new SceneManager();
        mgr.createScene("AnimatedScene", "A scene with multiple animations and animation groups");

        const camId = getId(mgr.addCamera("AnimatedScene", "cam", "ArcRotateCamera"));
        ok(mgr.setActiveCamera("AnimatedScene", camId));
        getId(mgr.addLight("AnimatedScene", "light", "DirectionalLight"));

        const sphereId = getId(mgr.addMesh("AnimatedScene", "sphere", "Sphere", { diameter: 2 }));

        const bounceAnim = getId(
            mgr.addAnimation(
                "AnimatedScene",
                "bounce",
                sphereId,
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

        const spinAnim = getId(
            mgr.addAnimation(
                "AnimatedScene",
                "spin",
                sphereId,
                "rotation.y",
                60,
                [
                    { frame: 0, value: 0 },
                    { frame: 60, value: 6.28 },
                ],
                "Cycle"
            )
        );

        getId(mgr.createAnimationGroup("AnimatedScene", "sphereMotion", [bounceAnim, spinAnim], { isLooping: true, speedRatio: 1.0 }));

        const boxId = getId(mgr.addMesh("AnimatedScene", "pulsingBox", "Box", { size: 1 }, { position: { x: 3, y: 0, z: 0 } }));
        getId(
            mgr.addAnimation(
                "AnimatedScene",
                "pulse",
                boxId,
                "scaling",
                60,
                [
                    { frame: 0, value: { x: 1, y: 1, z: 1 } },
                    { frame: 30, value: { x: 1.5, y: 1.5, z: 1.5 } },
                    { frame: 60, value: { x: 1, y: 1, z: 1 } },
                ],
                "Cycle"
            )
        );

        const issues = mgr.validateScene("AnimatedScene");
        expect(issues.filter((i: string) => i.startsWith("ERROR"))).toHaveLength(0);

        // Export ES6 code
        const code = mgr.exportCode("AnimatedScene", { format: "es6" })!;
        validateGeneratedCode(code);
        expect(code).toContain("Animation");
        expect(code).toContain("AnimationGroup");
        expect(code).toContain("import");

        fs.writeFileSync(path.join(EXAMPLES_DIR, "AnimatedScene.ts"), code);
    });

    // ── Example 4: Particle Effects (UMD code) ──────────────────────────

    it("Example 4: ParticleEffects – generates UMD code with particle systems", () => {
        const mgr = new SceneManager();
        mgr.createScene("ParticleEffects", "A scene with particle systems and gradients");

        const camId = getId(mgr.addCamera("ParticleEffects", "cam", "ArcRotateCamera"));
        ok(mgr.setActiveCamera("ParticleEffects", camId));
        getId(mgr.addLight("ParticleEffects", "light", "PointLight"));

        const emitterId = getId(mgr.addMesh("ParticleEffects", "emitter", "Sphere", { diameter: 0.5 }, { position: { x: 0, y: 1, z: 0 } }));

        const firePS = getId(
            mgr.addParticleSystem("ParticleEffects", "fire", 2000, emitterId, {
                emitterType: "Cone",
                emitRate: 100,
                minLifeTime: 0.3,
                maxLifeTime: 1.5,
                minSize: 0.1,
                maxSize: 0.5,
                blendMode: 1,
            })
        );

        ok(mgr.addParticleGradient("ParticleEffects", firePS, "color", 0, { r: 1, g: 0.8, b: 0, a: 1 }));
        ok(mgr.addParticleGradient("ParticleEffects", firePS, "color", 0.5, { r: 1, g: 0.3, b: 0, a: 0.8 }));
        ok(mgr.addParticleGradient("ParticleEffects", firePS, "color", 1.0, { r: 0.2, g: 0, b: 0, a: 0 }));
        ok(mgr.addParticleGradient("ParticleEffects", firePS, "size", 0, 0.1));
        ok(mgr.addParticleGradient("ParticleEffects", firePS, "size", 1.0, 0.5));

        const smokeEmitter = getId(mgr.addMesh("ParticleEffects", "smokeEmitter", "Box", { size: 0.3 }, { position: { x: 3, y: 0, z: 0 } }));
        getId(
            mgr.addParticleSystem("ParticleEffects", "smoke", 500, smokeEmitter, {
                emitterType: "Box",
                emitRate: 30,
                minLifeTime: 1,
                maxLifeTime: 3,
                minSize: 0.3,
                maxSize: 1.0,
            })
        );

        const issues = mgr.validateScene("ParticleEffects");
        expect(issues.filter((i: string) => i.startsWith("ERROR"))).toHaveLength(0);

        // Export UMD code (standalone page)
        const code = mgr.exportCode("ParticleEffects", {
            format: "umd",
            includeHtmlBoilerplate: true,
            includeEngineSetup: true,
            includeRenderLoop: true,
        })!;
        validateGeneratedCode(code);
        expect(code).toContain("ParticleSystem");
        expect(code).toContain("addColorGradient");

        fs.writeFileSync(path.join(EXAMPLES_DIR, "ParticleEffects.html"), code);
    });

    // ── Example 5: Full-Featured Scene (ES6 project) ─────────────────────

    it("Example 5: FullFeatured – generates ES6 project with all features", () => {
        const mgr = new SceneManager();
        mgr.createScene("FullFeatured", "A complex scene demonstrating multiple features");

        // Environment
        ok(
            mgr.setEnvironment("FullFeatured", {
                clearColor: { r: 0.05, g: 0.05, b: 0.1, a: 1 },
                ambientColor: { r: 0.1, g: 0.1, b: 0.15 },
                physicsEnabled: true,
                fogEnabled: true,
                fogMode: 3,
                fogColor: { r: 0.05, g: 0.05, b: 0.1 },
                fogDensity: 0.01,
            })
        );

        // Camera
        const camId = getId(mgr.addCamera("FullFeatured", "mainCam", "ArcRotateCamera"));
        ok(
            mgr.configureCameraProperties("FullFeatured", camId, {
                alpha: 1.57,
                beta: 1.2,
                radius: 15,
                target: { x: 0, y: 1, z: 0 },
            })
        );
        ok(mgr.setActiveCamera("FullFeatured", camId));

        // Lights
        const hemiId = getId(mgr.addLight("FullFeatured", "ambient", "HemisphericLight"));
        ok(mgr.configureLightProperties("FullFeatured", hemiId, { intensity: 0.3 }));
        const dirId = getId(mgr.addLight("FullFeatured", "sun", "DirectionalLight"));
        ok(mgr.configureLightProperties("FullFeatured", dirId, { intensity: 0.7 }));

        // Materials
        const floorMat = getId(mgr.addMaterial("FullFeatured", "floorMat", "PBRMaterial"));
        ok(
            mgr.configureMaterialProperties("FullFeatured", floorMat, {
                albedoColor: { r: 0.3, g: 0.3, b: 0.35 },
                metallic: 0.1,
                roughness: 0.9,
            })
        );
        const glowMat = getId(mgr.addMaterial("FullFeatured", "glowMat", "StandardMaterial"));
        ok(
            mgr.configureMaterialProperties("FullFeatured", glowMat, {
                emissiveColor: { r: 0, g: 0.5, b: 1 },
            })
        );

        // Floor + physics
        const floorId = getId(mgr.addMesh("FullFeatured", "floor", "Ground", { width: 20, height: 20 }));
        ok(mgr.assignMaterial("FullFeatured", floorId, floorMat));
        ok(mgr.addPhysicsBody("FullFeatured", floorId, "Static", "Box", { mass: 0 }));

        // Glowing sphere
        const glowSphere = getId(mgr.addMesh("FullFeatured", "glowSphere", "Sphere", { diameter: 1.5 }, { position: { x: 0, y: 2, z: 0 } }));
        ok(mgr.assignMaterial("FullFeatured", glowSphere, glowMat));

        // Highlighted box
        const hlBox = getId(mgr.addMesh("FullFeatured", "hlBox", "Box", { size: 1 }, { position: { x: -3, y: 0.5, z: 0 } }));

        // Render pipeline
        ok(
            mgr.configureRenderPipeline("FullFeatured", {
                bloomEnabled: true,
                bloomThreshold: 0.8,
                bloomWeight: 0.3,
                bloomKernel: 64,
                fxaaEnabled: true,
            })
        );

        // Glow + highlight layers
        const glowLayerId = getId(mgr.addGlowLayer("FullFeatured", "mainGlow", { intensity: 0.5 }));
        ok(mgr.addMeshToGlowLayer("FullFeatured", glowLayerId, glowSphere, "include"));
        const hlLayerId = getId(mgr.addHighlightLayer("FullFeatured", "selection"));
        ok(mgr.addMeshToHighlightLayer("FullFeatured", hlLayerId, hlBox, { r: 1, g: 1, b: 0 }));

        // Sound
        getId(mgr.addSound("FullFeatured", "ambient", "sounds/ambient.mp3", "static", { loop: true, autoplay: true, volume: 0.5 }));

        // Animation
        getId(
            mgr.addAnimation(
                "FullFeatured",
                "float",
                glowSphere,
                "position.y",
                60,
                [
                    { frame: 0, value: 2 },
                    { frame: 30, value: 3 },
                    { frame: 60, value: 2 },
                ],
                "Cycle"
            )
        );

        const issues = mgr.validateScene("FullFeatured");
        expect(issues.filter((i: string) => i.startsWith("ERROR"))).toHaveLength(0);

        // Export full ES6 project
        const project = mgr.exportProject("FullFeatured", { format: "es6" })!;
        validateProjectFiles(project);

        const srcCode = project["src/index.ts"];
        expect(srcCode).toContain("HavokPhysics");
        expect(srcCode).toContain("GlowLayer");
        expect(srcCode).toContain("HighlightLayer");
        expect(srcCode).toContain("DefaultRenderingPipeline");
        expect(srcCode).toContain("Animation");

        // Write project files
        const projectDir = path.join(EXAMPLES_DIR, "FullFeatured");
        for (const [relativePath, content] of Object.entries(project)) {
            const filePath = path.join(projectDir, relativePath);
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
            fs.writeFileSync(filePath, content);
        }
    });
});
