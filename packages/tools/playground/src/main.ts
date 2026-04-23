/**
 * Vite dev server entry point for the Babylon.js Playground.
 *
 * Architecture: this file is the Vite-served ES module counterpart to the
 * webpack-built babylon.playground.js UMD bundle. It does NOT import Babylon
 * directly — Babylon (babylon.js, loaders, inspector, etc.) is loaded as
 * pre-built UMD bundles from the babylonServer CDN clone (localhost:1337),
 * exactly as in production. public/index.js handles that bootstrap.
 *
 * Vite serves: the React playground UI (Monaco, toolbar, panels).
 * babylonServer serves: babylon.js, babylon.gui, inspector, loaders, etc.
 *
 * The shim served by the Vite dev server at /babylon.playground.js intercepts
 * the CDN bootstrap's final BABYLON.Playground.Show() call and emits a
 * CustomEvent. This module listens for it and invokes the real Playground.Show.
 */
import "./monacoWorkerSetup";
import { Playground } from "./playground";

type ShowArgs = Parameters<typeof Playground.Show>;

function StartPlayground(args: ShowArgs) {
    Playground.Show(...args);
}

// The CDN bootstrap (public/index.js) calls BABYLON.Playground.Show after
// loading all babylon bundles from babylonServer. The /babylon.playground.js
// shim captures those args in window.__vitePlaygroundArgs and dispatches
// a "babylonPlaygroundReady" event. As a deferred module, main.ts may
// run before or after that shim — handle both orderings.
const Win = window as unknown as Record<string, unknown>;
if (Array.isArray(Win["__vitePlaygroundArgs"])) {
    StartPlayground(Win["__vitePlaygroundArgs"] as ShowArgs);
} else {
    window.addEventListener(
        "babylonPlaygroundReady",
        (e: Event) => {
            StartPlayground((e as CustomEvent<{ args: ShowArgs }>).detail.args);
        },
        { once: true }
    );
}
