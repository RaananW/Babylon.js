import { generateSceneCode } from "../../src/generators/sceneCode";
import type { ProjectOptions } from "../../src/index";

describe("generateSceneCode", () => {
    it("generates ES6 TypeScript scene with tree-shakeable imports and glTF loader", () => {
        const options: ProjectOptions = {
            projectName: "app",
            moduleFormat: "es6",
            language: "ts",
            bundler: "vite",
        };
        const code = generateSceneCode(options);
        expect(code).toContain('import { Engine } from "@babylonjs/core/Engines/engine"');
        expect(code).toContain('import { Scene } from "@babylonjs/core/scene"');
        expect(code).toContain("as HTMLCanvasElement");
        expect(code).toContain('@babylonjs/loaders/glTF');
        expect(code).toContain("SceneLoader.AppendAsync");
        expect(code).toContain("createDefaultEnvironment");
        expect(code).toContain("@babylonjs/core/Helpers/sceneHelpers");
        expect(code).not.toContain("BABYLON.");
    });

    it("generates ES6 JavaScript scene without type casts", () => {
        const options: ProjectOptions = {
            projectName: "app",
            moduleFormat: "es6",
            language: "js",
            bundler: "vite",
        };
        const code = generateSceneCode(options);
        expect(code).toContain('import { Engine } from "@babylonjs/core/Engines/engine"');
        expect(code).not.toContain("as HTMLCanvasElement");
        expect(code).toContain('@babylonjs/loaders/glTF');
    });

    it("generates UMD TypeScript scene with BABYLON namespace and loaders import", () => {
        const options: ProjectOptions = {
            projectName: "app",
            moduleFormat: "umd",
            language: "ts",
            bundler: "webpack",
        };
        const code = generateSceneCode(options);
        expect(code).toContain('import * as BABYLON from "babylonjs"');
        expect(code).toContain('import "babylonjs-loaders"');
        expect(code).toContain("BABYLON.Engine");
        expect(code).toContain("BABYLON.SceneLoader.AppendAsync");
        expect(code).toContain("createDefaultEnvironment");
    });

    it("generates UMD JavaScript scene with BABYLON global", () => {
        const options: ProjectOptions = {
            projectName: "app",
            moduleFormat: "umd",
            language: "js",
            bundler: "webpack",
        };
        const code = generateSceneCode(options);
        expect(code).toContain("BABYLON.Engine");
        expect(code).toContain("BABYLON.SceneLoader.AppendAsync");
        expect(code).not.toContain("import ");
    });

    it("always includes resize handler, render loop, and environment", () => {
        const combos: ProjectOptions[] = [
            { projectName: "a", moduleFormat: "es6", language: "ts", bundler: "vite" },
            { projectName: "b", moduleFormat: "umd", language: "js", bundler: "webpack" },
        ];
        for (const options of combos) {
            const code = generateSceneCode(options);
            expect(code).toContain("engine.runRenderLoop");
            expect(code).toContain("engine.resize()");
            expect(code).toContain("createDefaultEnvironment");
            expect(code).toContain("BoomBox.glb");
        }
    });
});
