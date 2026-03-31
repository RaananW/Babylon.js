import type { ProjectOptions } from "../index";

export function generateIndexHtml(options: ProjectOptions): string {
    const { bundler, moduleFormat } = options;

    const styles = `
        html, body {
            overflow: hidden;
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
        }

        #renderCanvas {
            width: 100%;
            height: 100%;
            touch-action: none;
        }`;

    // CDN-only (no bundler, UMD)
    if (bundler === "none") {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Babylon.js App</title>
    <style>${styles}
    </style>
    <script src="https://cdn.babylonjs.com/babylon.js"><\/script>
</head>
<body>
    <canvas id="renderCanvas"></canvas>
    <script>
        const canvas = document.getElementById("renderCanvas");
        const engine = new BABYLON.Engine(canvas, true);

        const createScene = function () {
            const scene = new BABYLON.Scene(engine);

            const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 3, new BABYLON.Vector3(0, 0, 0), scene);
            camera.attachControl(canvas, true);

            const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
            light.intensity = 0.7;

            BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: 2, segments: 32 }, scene);
            BABYLON.MeshBuilder.CreateGround("ground", { width: 6, height: 6 }, scene);

            return scene;
        };

        const scene = createScene();

        engine.runRenderLoop(function () {
            scene.render();
        });

        window.addEventListener("resize", function () {
            engine.resize();
        });
    <\/script>
</body>
</html>
`;
    }

    // Vite serves index.html from root — entry via <script type="module">
    if (bundler === "vite") {
        const ext = moduleFormat === "umd" && options.language === "js" ? "js" : options.language === "ts" ? "ts" : "js";
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Babylon.js App</title>
    <style>${styles}
    </style>
</head>
<body>
    <canvas id="renderCanvas"></canvas>
    <script type="module" src="/src/index.${ext}"><\/script>
</body>
</html>
`;
    }

    // Webpack uses HtmlWebpackPlugin — no script tag needed
    if (bundler === "webpack") {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Babylon.js App</title>
    <style>${styles}
    </style>
</head>
<body>
    <canvas id="renderCanvas"></canvas>
</body>
</html>
`;
    }

    // Rollup — bundle injected into dist/, reference it
    if (bundler === "rollup") {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Babylon.js App</title>
    <style>${styles}
    </style>
</head>
<body>
    <canvas id="renderCanvas"></canvas>
    <script src="dist/bundle.js"><\/script>
</body>
</html>
`;
    }

    return "";
}
