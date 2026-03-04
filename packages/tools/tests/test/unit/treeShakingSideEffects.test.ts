/* eslint-disable babylonjs/syntax */
/**
 * Tree-Shaking / Side-Effects Isolation Tests
 *
 * Verifies that importing from `.pure.js` entry points (or side-effect-free
 * modules) does NOT pull in side-effect code such as RegisterClass calls,
 * engine extensions, or bare-import modules (e.g. "./animatable").
 *
 * Uses both **Rollup** and **Webpack** programmatically in each test.
 *
 * Two test suites are generated:
 *   1. `@dev/core`      — the internal dev build (`packages/dev/core/dist`)
 *   2. `@babylonjs/core` — the public npm package (`packages/public/@babylonjs/core`)
 *
 * Prerequisites: both packages must be compiled before running.
 */

import { writeFileSync, mkdirSync, readFileSync, rmSync, statSync, existsSync } from "fs";
import { join, resolve } from "path";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REPO_ROOT = resolve(__dirname, "../../../../..");
const TMP_DIR = join(REPO_ROOT, "packages/tools/tests/test/unit/.tmp-treeshake");

/** Packages under test — each gets its own describe() block. */
const PACKAGES: { label: string; distDir: string; markerFile: string }[] = [
    {
        label: "@dev/core",
        distDir: join(REPO_ROOT, "packages/dev/core/dist"),
        markerFile: "Maths/ThinMaths/index.js",
    },
    {
        label: "@babylonjs/core",
        distDir: join(REPO_ROOT, "packages/public/@babylonjs/core"),
        markerFile: "Maths/ThinMaths/index.js",
    },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ensureDir(dir: string) {
    mkdirSync(dir, { recursive: true });
}

function fileSize(p: string): number {
    try {
        return statSync(p).size;
    } catch {
        return -1;
    }
}

// ---------------------------------------------------------------------------
// Bundler wrappers
// ---------------------------------------------------------------------------

/**
 * Bundle `entryCode` with Rollup and return the output string and byte size.
 */
async function bundleWithRollup(name: string, entryCode: string, distDir: string): Promise<{ content: string; size: number }> {
    const { rollup } = await import("rollup");

    const entryPath = join(TMP_DIR, `${name}-entry.mjs`);
    const outPath = join(TMP_DIR, `${name}-rollup-out.mjs`);
    writeFileSync(entryPath, entryCode);

    const bundle = await rollup({
        input: entryPath,
        external: (id: string, importer?: string) => {
            if (id === entryPath) return false;
            if (id.startsWith(distDir)) return false;
            // Relative imports (./  ../) from files inside distDir are internal
            if ((id.startsWith("./") || id.startsWith("../")) && importer && importer.startsWith(distDir)) return false;
            // Allow following relative imports inside core dist
            return true;
        },
        treeshake: {
            moduleSideEffects: (id: string) => {
                // Mirror package.json sideEffects: .pure.js and /pure.js and .functions.js are side-effect-free
                if (id.endsWith(".pure.js")) return false;
                if (id.endsWith("/pure.js")) return false;
                if (id.endsWith(".functions.js")) return false;
                if (id.includes("/Maths/ThinMaths/")) return false;
                return true;
            },
        },
        logLevel: "silent",
    });

    await bundle.write({ file: outPath, format: "esm", inlineDynamicImports: true });
    await bundle.close();

    const content = readFileSync(outPath, "utf-8");
    return { content, size: fileSize(outPath) };
}

/**
 * Bundle `entryCode` with Webpack (production mode, full tree-shaking) and
 * return the output string and byte size.
 */
async function bundleWithWebpack(name: string, entryCode: string, distDir: string): Promise<{ content: string; size: number }> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const webpack = require("webpack");

    const entryPath = join(TMP_DIR, `${name}-entry.mjs`);
    const outDir = join(TMP_DIR, `${name}-webpack-out`);
    writeFileSync(entryPath, entryCode);

    return new Promise((resolvePromise, rejectPromise) => {
        const compiler = webpack({
            mode: "production",
            entry: entryPath,
            output: { path: outDir, filename: "bundle.js" },
            optimization: {
                usedExports: true,
                sideEffects: true,
                minimize: false, // keep output readable so we can search for forbidden strings
            },
            resolve: {
                extensions: [".js", ".mjs"],
                alias: { core: distDir },
            },
            module: {
                rules: [
                    { test: /Maths[\\/]ThinMaths/, sideEffects: false },
                    { test: /\.pure\.js$/, sideEffects: false },
                    { test: /[\\/]pure\.js$/, sideEffects: false },
                    { test: /\.functions\.js$/, sideEffects: false },
                ],
            },
        });

        compiler.run((err: Error | null, stats: any) => {
            compiler.close(() => {});
            if (err) return rejectPromise(err);
            if (stats.hasErrors()) {
                const info = stats.toJson({ errors: true });
                return rejectPromise(
                    new Error(
                        info.errors
                            .map((e: any) => e.message)
                            .join("\n")
                            .substring(0, 1000)
                    )
                );
            }
            const bundlePath = join(outDir, "bundle.js");
            const content = fileSize(bundlePath) > 0 ? readFileSync(bundlePath, "utf-8") : "";
            resolvePromise({ content, size: fileSize(bundlePath) });
        });
    });
}

// ---------------------------------------------------------------------------
// Test definitions
// ---------------------------------------------------------------------------

interface SideEffectTestCase {
    /** Human-readable test name */
    name: string;
    /** JS code for the entry file (use %DIST% as placeholder for the dist directory) */
    entryCode: string;
    /** Strings that MUST NOT appear in the bundled output */
    forbiddenStrings: string[];
    /** Optional max bundle size in bytes (for "bare import → near-empty" checks) */
    maxBundleSizeBytes?: number;
    /** Description shown in Jest output */
    description: string;
}

/** Build test cases — uses %DIST% placeholder which is replaced per-package. */

// ── Reusable forbidden-string sets ──────────────────────────────────────────
// Each string is an `export class …` or `export function …` signature that
// ONLY appears when the corresponding module is actually bundled.  Using class
// definitions avoids false positives from string constants / method names that
// legitimately reference these subsystems by name.
const FORBIDDEN = {
    physics: ["class PhysicsEngine ", "class PhysicsBody "],
    particles: ["class ParticleSystem ", "class GPUParticleSystem "],
    postProcess: ["class PostProcess extends"],
    flowGraph: ["class FlowGraph {"],
    nodeGeometry: ["class NodeGeometry "],
    greasedLine: ["class GreasedLineMesh "],
    audio: ["class Sound {"],
    sprites: ["class SpriteManager {"],
    shadows: ["class ShadowGenerator {"],
    layers: ["class GlowLayer extends", "class HighlightLayer extends"],
} as const;

/** Combine multiple forbidden sets into one flat array. */
function forbidden(...keys: (keyof typeof FORBIDDEN)[]): string[] {
    return keys.flatMap((k) => [...FORBIDDEN[k]]);
}

const TEST_CASE_TEMPLATES: SideEffectTestCase[] = [
    // ── Bare-import tests (should tree-shake to near-empty) ─────────────────
    {
        name: "animationGroup-pure-bare",
        entryCode: `import "%DIST%/Animations/animationGroup.pure.js";\n`,
        forbiddenStrings: [],
        maxBundleSizeBytes: 500,
        description: "Bare import of animationGroup.pure should produce near-empty bundle",
    },
    {
        name: "videoTexture-pure-bare",
        entryCode: `import "%DIST%/Materials/Textures/videoTexture.pure.js";\n`,
        forbiddenStrings: [],
        maxBundleSizeBytes: 500,
        description: "Bare import of videoTexture.pure should produce near-empty bundle",
    },
    {
        name: "root-pure-barrel-bare",
        entryCode: `import "%DIST%/pure.js";\n`,
        forbiddenStrings: [],
        maxBundleSizeBytes: 500,
        description: "Bare import of root pure barrel should produce near-empty bundle",
    },

    // ── Named-import content tests (should NOT contain side-effect code) ────
    //
    // These checks use SPECIFIC RegisterClass call signatures that only the
    // side-effect wrapper files add.  Transitive deps (e.g. Texture base class)
    // may legitimately contain RegisterClass calls for *their own* classes;
    // that is expected and not tested here.
    {
        name: "animationGroup-pure-named",
        entryCode: `import { AnimationGroup } from "%DIST%/Animations/animationGroup.pure.js";\nconsole.log(AnimationGroup);\n`,
        forbiddenStrings: [
            // The side-effect wrapper calls RegisterClass("BABYLON.AnimationGroup", ...)
            // If the wrapper leaks into the pure bundle, this exact string appears.
            'RegisterClass("BABYLON.AnimationGroup"',
        ],
        description: "Named import of AnimationGroup from .pure should not contain its RegisterClass side-effect",
    },
    {
        name: "videoTexture-pure-named",
        entryCode: `import { VideoTexture } from "%DIST%/Materials/Textures/videoTexture.pure.js";\nconsole.log(VideoTexture);\n`,
        forbiddenStrings: [
            // The side-effect wrapper calls RegisterClass("BABYLON.VideoTexture", ...)
            'RegisterClass("BABYLON.VideoTexture"',
        ],
        description: "Named import of VideoTexture from .pure should not contain its RegisterClass side-effect",
    },
    {
        name: "root-pure-barrel-named-Color3",
        entryCode: `import { Color3 } from "%DIST%/pure.js";\nconsole.log(Color3);\n`,
        forbiddenStrings: [
            // Color3 is in math.color.pure — no RegisterClass should appear for any class
            // because the whole chain goes through .pure files and the root pure barrel.
            'RegisterClass("BABYLON.Color3"',
        ],
        description: "Named import of Color3 from root pure barrel should not contain Color3 RegisterClass",
    },
    {
        name: "root-pure-barrel-named-Vector3",
        entryCode: `import { Vector3 } from "%DIST%/pure.js";\nconsole.log(Vector3);\n`,
        forbiddenStrings: ['RegisterClass("BABYLON.Vector3"'],
        description: "Named import of Vector3 from root pure barrel should not contain Vector3 RegisterClass",
    },

    // ── Free-function isolation tests ───────────────────────────────────────
    {
        name: "vector-functions-bare",
        entryCode: `import "%DIST%/Maths/math.vector.functions.js";\n`,
        forbiddenStrings: [],
        maxBundleSizeBytes: 500,
        description: "Bare import of math.vector.functions (side-effect-free) should produce near-empty bundle",
    },
    {
        name: "color-functions-bare",
        entryCode: `import "%DIST%/Maths/math.color.functions.js";\n`,
        forbiddenStrings: [],
        maxBundleSizeBytes: 500,
        description: "Bare import of math.color.functions (side-effect-free) should produce near-empty bundle",
    },

    // ── Simple scene test (cherry-picked imports should not pull in heavy subsystems) ──
    {
        name: "simple-scene-selective-imports",
        entryCode: [
            `import { Scene } from "%DIST%/scene.pure.js";`,
            `import { FreeCamera } from "%DIST%/Cameras/freeCamera.pure.js";`,
            `import { HemisphericLight } from "%DIST%/Lights/hemisphericLight.js";`,
            `import { Mesh } from "%DIST%/Meshes/mesh.pure.js";`,
            `import { CreateBox } from "%DIST%/Meshes/Builders/boxBuilder.js";`,
            `import { Vector3 } from "%DIST%/Maths/math.vector.js";`,
            `import { Color3 } from "%DIST%/Maths/math.color.js";`,
            ``,
            `// Minimal scene setup — just enough to keep all imports alive`,
            `const engine = { dummy: true };`,
            `const scene = new Scene(engine);`,
            `const camera = new FreeCamera("cam", new Vector3(0, 1, -5), scene);`,
            `const light = new HemisphericLight("light", Vector3.Up(), scene);`,
            `light.diffuse = new Color3(1, 1, 1);`,
            `const box = CreateBox("box", {}, scene);`,
            `console.log(scene, camera, light, box, Mesh);`,
            ``,
        ].join("\n"),
        forbiddenStrings: forbidden("physics", "particles", "postProcess", "nodeGeometry", "flowGraph", "greasedLine"),
        description: "Simple scene with cherry-picked imports should not include Physics, Particles, PostProcess, etc.",
    },

    // ── PBR Material scene ──────────────────────────────────────────────────
    // Imports from Materials/PBR, Cameras, Lights, Meshes/Builders, Textures.
    // Should NOT pull in Physics, Particles, FlowGraph, NodeGeometry, Audio,
    // Sprites, or GreasedLine.
    {
        name: "pbr-material-scene",
        entryCode: [
            `import { Scene } from "%DIST%/scene.pure.js";`,
            `import { ArcRotateCamera } from "%DIST%/Cameras/arcRotateCamera.js";`,
            `import { DirectionalLight } from "%DIST%/Lights/directionalLight.js";`,
            `import { PBRMaterial } from "%DIST%/Materials/PBR/pbrMaterial.pure.js";`,
            `import { Texture } from "%DIST%/Materials/Textures/texture.js";`,
            `import { CreateSphere } from "%DIST%/Meshes/Builders/sphereBuilder.js";`,
            `import { CreateGround } from "%DIST%/Meshes/Builders/groundBuilder.js";`,
            `import { Vector3 } from "%DIST%/Maths/math.vector.js";`,
            `import { Color3 } from "%DIST%/Maths/math.color.js";`,
            ``,
            `const engine = { dummy: true };`,
            `const scene = new Scene(engine);`,
            `const camera = new ArcRotateCamera("cam", 0, 1, 10, Vector3.Zero(), scene);`,
            `const light = new DirectionalLight("dir", new Vector3(-1, -2, -1), scene);`,
            `const mat = new PBRMaterial("pbr", scene);`,
            `mat.albedoColor = new Color3(1, 0.76, 0.33);`,
            `const tex = new Texture("dummy.png", scene);`,
            `mat.albedoTexture = tex;`,
            `const sphere = CreateSphere("sphere", { diameter: 2 }, scene);`,
            `sphere.material = mat;`,
            `const ground = CreateGround("ground", { width: 10, height: 10 }, scene);`,
            `console.log(scene, camera, light, sphere, ground);`,
            ``,
        ].join("\n"),
        forbiddenStrings: forbidden("physics", "particles", "flowGraph", "nodeGeometry", "audio", "sprites", "greasedLine"),
        description: "PBR material scene should not include Physics, Particles, FlowGraph, NodeGeometry, Audio, Sprites, or GreasedLine",
    },

    // ── Animation scene ─────────────────────────────────────────────────────
    // Imports from Animations (.pure), Materials, Lights, Cameras.
    // Should NOT pull in Physics, Particles, PostProcess, FlowGraph,
    // NodeGeometry, Shadows, or GreasedLine.
    {
        name: "animation-scene",
        entryCode: [
            `import { Scene } from "%DIST%/scene.pure.js";`,
            `import { FreeCamera } from "%DIST%/Cameras/freeCamera.pure.js";`,
            `import { HemisphericLight } from "%DIST%/Lights/hemisphericLight.js";`,
            `import { StandardMaterial } from "%DIST%/Materials/standardMaterial.js";`,
            `import { Mesh } from "%DIST%/Meshes/mesh.pure.js";`,
            `import { CreateBox } from "%DIST%/Meshes/Builders/boxBuilder.js";`,
            `import { Animation } from "%DIST%/Animations/animation.pure.js";`,
            `import { AnimationGroup } from "%DIST%/Animations/animationGroup.pure.js";`,
            `import { Vector3 } from "%DIST%/Maths/math.vector.js";`,
            `import { Color3 } from "%DIST%/Maths/math.color.js";`,
            ``,
            `const engine = { dummy: true };`,
            `const scene = new Scene(engine);`,
            `const camera = new FreeCamera("cam", new Vector3(0, 5, -10), scene);`,
            `const light = new HemisphericLight("light", Vector3.Up(), scene);`,
            `const mat = new StandardMaterial("mat", scene);`,
            `mat.diffuseColor = new Color3(1, 0, 0);`,
            `const box = CreateBox("box", {}, scene);`,
            `box.material = mat;`,
            `const anim = new Animation("anim", "position.y", 30, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);`,
            `const grp = new AnimationGroup("grp", scene);`,
            `console.log(scene, camera, light, box, mat, anim, grp, Mesh);`,
            ``,
        ].join("\n"),
        forbiddenStrings: forbidden("physics", "particles", "postProcess", "flowGraph", "nodeGeometry", "shadows", "greasedLine"),
        description: "Animation scene should not include Physics, Particles, PostProcess, FlowGraph, NodeGeometry, Shadows, or GreasedLine",
    },

    // ── Multi-light + shadow scene ──────────────────────────────────────────
    // Uses multiple light types and ShadowGenerator.
    // Should NOT pull in Physics, Particles, FlowGraph, NodeGeometry, Audio,
    // or GreasedLine.
    {
        name: "multi-light-shadow-scene",
        entryCode: [
            `import { Scene } from "%DIST%/scene.pure.js";`,
            `import { ArcRotateCamera } from "%DIST%/Cameras/arcRotateCamera.js";`,
            `import { DirectionalLight } from "%DIST%/Lights/directionalLight.js";`,
            `import { PointLight } from "%DIST%/Lights/pointLight.js";`,
            `import { SpotLight } from "%DIST%/Lights/spotLight.js";`,
            `import { ShadowGenerator } from "%DIST%/Lights/Shadows/shadowGenerator.js";`,
            `import { StandardMaterial } from "%DIST%/Materials/standardMaterial.js";`,
            `import { CreateBox } from "%DIST%/Meshes/Builders/boxBuilder.js";`,
            `import { CreateGround } from "%DIST%/Meshes/Builders/groundBuilder.js";`,
            `import { Vector3 } from "%DIST%/Maths/math.vector.js";`,
            ``,
            `const engine = { dummy: true };`,
            `const scene = new Scene(engine);`,
            `const camera = new ArcRotateCamera("cam", 0, 0.8, 20, Vector3.Zero(), scene);`,
            `const dirLight = new DirectionalLight("dir", new Vector3(-1, -2, -1), scene);`,
            `const ptLight = new PointLight("pt", new Vector3(0, 5, 0), scene);`,
            `const spotLight = new SpotLight("spot", new Vector3(0, 10, 0), new Vector3(0, -1, 0), Math.PI / 4, 2, scene);`,
            `const shadow = new ShadowGenerator(1024, dirLight);`,
            `const mat = new StandardMaterial("mat", scene);`,
            `const box = CreateBox("box", {}, scene);`,
            `box.material = mat;`,
            `shadow.addShadowCaster(box);`,
            `const ground = CreateGround("ground", { width: 20, height: 20 }, scene);`,
            `ground.receiveShadows = true;`,
            `console.log(scene, camera, dirLight, ptLight, spotLight, shadow, box, ground);`,
            ``,
        ].join("\n"),
        forbiddenStrings: forbidden("physics", "particles", "flowGraph", "nodeGeometry", "audio", "greasedLine"),
        description: "Multi-light + shadow scene should not include Physics, Particles, FlowGraph, NodeGeometry, Audio, or GreasedLine",
    },

    // ── Mesh builders + ActionManager scene ─────────────────────────────────
    // Uses many different mesh builder functions + ActionManager from Actions/.
    // Should NOT pull in Physics, Particles, PostProcess, FlowGraph,
    // NodeGeometry, Audio, Shadows, or GreasedLine.
    {
        name: "mesh-builders-action-scene",
        entryCode: [
            `import { Scene } from "%DIST%/scene.pure.js";`,
            `import { FreeCamera } from "%DIST%/Cameras/freeCamera.pure.js";`,
            `import { HemisphericLight } from "%DIST%/Lights/hemisphericLight.js";`,
            `import { CreateBox } from "%DIST%/Meshes/Builders/boxBuilder.js";`,
            `import { CreateSphere } from "%DIST%/Meshes/Builders/sphereBuilder.js";`,
            `import { CreateCylinder } from "%DIST%/Meshes/Builders/cylinderBuilder.js";`,
            `import { CreatePlane } from "%DIST%/Meshes/Builders/planeBuilder.js";`,
            `import { CreateTorus } from "%DIST%/Meshes/Builders/torusBuilder.js";`,
            `import { CreateGround } from "%DIST%/Meshes/Builders/groundBuilder.js";`,
            `import { ActionManager } from "%DIST%/Actions/actionManager.js";`,
            `import { Vector3 } from "%DIST%/Maths/math.vector.js";`,
            ``,
            `const engine = { dummy: true };`,
            `const scene = new Scene(engine);`,
            `const camera = new FreeCamera("cam", new Vector3(0, 5, -10), scene);`,
            `const light = new HemisphericLight("light", Vector3.Up(), scene);`,
            `const box = CreateBox("box", { size: 1 }, scene);`,
            `const sphere = CreateSphere("sphere", { diameter: 2 }, scene);`,
            `const cyl = CreateCylinder("cyl", { height: 3 }, scene);`,
            `const plane = CreatePlane("plane", { size: 5 }, scene);`,
            `const torus = CreateTorus("torus", { diameter: 2 }, scene);`,
            `const ground = CreateGround("ground", { width: 50, height: 50 }, scene);`,
            `box.actionManager = new ActionManager(scene);`,
            `console.log(scene, camera, light, box, sphere, cyl, plane, torus, ground);`,
            ``,
        ].join("\n"),
        forbiddenStrings: forbidden("physics", "particles", "postProcess", "flowGraph", "nodeGeometry", "audio", "shadows", "greasedLine"),
        description: "Mesh builders + ActionManager scene should not include Physics, Particles, PostProcess, FlowGraph, NodeGeometry, Audio, Shadows, or GreasedLine",
    },

    // ── Textures + mixed materials scene ────────────────────────────────────
    // Uses Texture, CubeTexture, StandardMaterial, PBRMaterial (pure), and
    // multiple light types.  Should NOT pull in Physics, Particles, FlowGraph,
    // NodeGeometry, Audio, or GreasedLine.
    {
        name: "textures-materials-scene",
        entryCode: [
            `import { Scene } from "%DIST%/scene.pure.js";`,
            `import { ArcRotateCamera } from "%DIST%/Cameras/arcRotateCamera.js";`,
            `import { HemisphericLight } from "%DIST%/Lights/hemisphericLight.js";`,
            `import { PointLight } from "%DIST%/Lights/pointLight.js";`,
            `import { StandardMaterial } from "%DIST%/Materials/standardMaterial.js";`,
            `import { PBRMaterial } from "%DIST%/Materials/PBR/pbrMaterial.pure.js";`,
            `import { Texture } from "%DIST%/Materials/Textures/texture.js";`,
            `import { CubeTexture } from "%DIST%/Materials/Textures/cubeTexture.js";`,
            `import { CreateBox } from "%DIST%/Meshes/Builders/boxBuilder.js";`,
            `import { CreateSphere } from "%DIST%/Meshes/Builders/sphereBuilder.js";`,
            `import { Vector3 } from "%DIST%/Maths/math.vector.js";`,
            `import { Color3 } from "%DIST%/Maths/math.color.js";`,
            ``,
            `const engine = { dummy: true };`,
            `const scene = new Scene(engine);`,
            `const camera = new ArcRotateCamera("cam", -Math.PI / 2, Math.PI / 3, 10, Vector3.Zero(), scene);`,
            `const hemi = new HemisphericLight("hemi", Vector3.Up(), scene);`,
            `const pt = new PointLight("pt", new Vector3(2, 5, 2), scene);`,
            `const stdMat = new StandardMaterial("std", scene);`,
            `stdMat.diffuseColor = new Color3(0.8, 0.2, 0.2);`,
            `stdMat.diffuseTexture = new Texture("diffuse.png", scene);`,
            `const pbrMat = new PBRMaterial("pbr", scene);`,
            `pbrMat.albedoColor = new Color3(0.9, 0.9, 0.9);`,
            `pbrMat.reflectionTexture = new CubeTexture("env", scene);`,
            `const box = CreateBox("box", {}, scene);`,
            `box.material = stdMat;`,
            `const sphere = CreateSphere("sphere", {}, scene);`,
            `sphere.material = pbrMat;`,
            `console.log(scene, camera, hemi, pt, box, sphere);`,
            ``,
        ].join("\n"),
        forbiddenStrings: forbidden("physics", "particles", "flowGraph", "nodeGeometry", "audio", "greasedLine"),
        description: "Textures + mixed materials scene should not include Physics, Particles, FlowGraph, NodeGeometry, Audio, or GreasedLine",
    },
];

/** Resolve %DIST% placeholders for a specific package. */
function resolveTestCases(distDir: string): SideEffectTestCase[] {
    return TEST_CASE_TEMPLATES.map((t) => ({
        ...t,
        entryCode: t.entryCode.replace(/%DIST%/g, distDir),
    }));
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Test suites — one per package
// ---------------------------------------------------------------------------

for (const pkg of PACKAGES) {
    describe(`Tree-shaking side-effects isolation (${pkg.label})`, () => {
        const distDir = pkg.distDir;
        let testCases: SideEffectTestCase[];

        beforeAll(() => {
            // Ensure the package is compiled
            const marker = join(distDir, pkg.markerFile);
            if (!existsSync(marker)) {
                throw new Error(`${pkg.label} dist not found at ${distDir}. Run the appropriate build command first.`);
            }
            ensureDir(TMP_DIR);
            testCases = resolveTestCases(distDir);
        });

        afterAll(() => {
            // Clean up temp artefacts
            rmSync(TMP_DIR, { recursive: true, force: true });
        });

        // Generate test cases for each bundler × test case
        for (const template of TEST_CASE_TEMPLATES) {
            describe(template.name, () => {
                // ── Rollup ──────────────────────────────────────────────────
                it(`[Rollup] ${template.description}`, async () => {
                    const tc = testCases.find((t) => t.name === template.name)!;
                    const uniqueName = `${pkg.label.replace(/[/@]/g, "_")}-${tc.name}`;
                    const result = await bundleWithRollup(uniqueName, tc.entryCode, distDir);

                    // Size check (for bare-import tests)
                    if (tc.maxBundleSizeBytes !== undefined) {
                        expect(result.size, `Rollup bundle too large (${result.size} bytes, max ${tc.maxBundleSizeBytes})`).toBeLessThanOrEqual(tc.maxBundleSizeBytes);
                    }

                    // Forbidden string checks
                    for (const forbidden of tc.forbiddenStrings) {
                        expect(
                            result.content,
                            `Rollup bundle for "${tc.name}" should NOT contain "${forbidden}".\nBundle preview:\n${result.content.substring(0, 500)}`
                        ).not.toContain(forbidden);
                    }
                }, 30_000);

                // ── Webpack ─────────────────────────────────────────────────
                it(`[Webpack] ${template.description}`, async () => {
                    const tc = testCases.find((t) => t.name === template.name)!;
                    const uniqueName = `${pkg.label.replace(/[/@]/g, "_")}-${tc.name}`;
                    const result = await bundleWithWebpack(uniqueName, tc.entryCode, distDir);

                    // Size check (for bare-import tests)
                    if (tc.maxBundleSizeBytes !== undefined) {
                        expect(result.size, `Webpack bundle too large (${result.size} bytes, max ${tc.maxBundleSizeBytes})`).toBeLessThanOrEqual(tc.maxBundleSizeBytes);
                    }

                    // Forbidden string checks
                    for (const forbidden of tc.forbiddenStrings) {
                        expect(
                            result.content,
                            `Webpack bundle for "${tc.name}" should NOT contain "${forbidden}".\nBundle preview:\n${result.content.substring(0, 500)}`
                        ).not.toContain(forbidden);
                    }
                }, 30_000);
            });
        }
    });
}
