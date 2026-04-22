/**
 * Vite dev server entry point for the Babylon.js Playground.
 *
 * Detects RuntimeMode from the page URL (same logic as public/index.js)
 * and calls Playground.Show directly, importing Babylon from the monorepo
 * instead of from the CDN.
 *
 * For production CDN deployments use:
 *   npm run build:deployment -w @tools/playground
 */
// Set up MonacoEnvironment BEFORE monaco imports so workers resolve correctly.
import "./monacoWorkerSetup";
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import * as BABYLONNs from "core";
import { AttachInspectorGlobals } from "inspector/legacy/legacy";
import { Playground } from "./playground";
import { RuntimeMode } from "./globalState";

// Expose Babylon globally so that legacy playground code (e.g. `new BABYLON.Scene(engine)`)
// works in the runner. In CDN mode window.BABYLON is set by the UMD babylon.js bundle.
// In Vite dev mode we import the ES module — but ES module namespace objects are
// non-extensible, so the CDN inspector bundle (UMD) fails when it tries to assign
// BABYLON.Inspector to it. We copy all exports into a plain mutable object first.
// eslint-disable-next-line @typescript-eslint/naming-convention
const BABYLON = Object.assign(Object.create(null) as Record<string, unknown>, BABYLONNs as unknown as Record<string, unknown>);
(window as unknown as Record<string, unknown>)["BABYLON"] = BABYLON;

// Attach Inspector v2 globals (sets window.INSPECTOR and window.BABYLON.Inspector).
// In CDN mode the UMD inspector bundle does this; in Vite dev mode we import the
// ESM inspector-v2 package directly and wire it up via its legacy compatibility shim.
AttachInspectorGlobals();

const HostElement = document.getElementById("host-element") as HTMLElement;

// Detect runtime mode from the page filename — mirrors public/index.js behaviour.
// RuntimeMode.Editor = 0 (default), Full = 1, Frame = 2
// eslint-disable-next-line prettier/prettier
const CurrentMode = window.location.href.includes("full.html") ? RuntimeMode.Full : window.location.href.includes("frame.html") ? RuntimeMode.Frame : RuntimeMode.Editor;

Playground.Show(HostElement, CurrentMode, "dev", []);
