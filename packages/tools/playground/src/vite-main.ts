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
import { Playground } from "./playground";
import { RuntimeMode } from "./globalState";

const HostElement = document.getElementById("host-element") as HTMLElement;

// Detect runtime mode from the page filename — mirrors public/index.js behaviour.
// RuntimeMode.Editor = 0 (default), Full = 1, Frame = 2
// eslint-disable-next-line prettier/prettier
const CurrentMode = window.location.href.includes("full.html") ? RuntimeMode.Full : window.location.href.includes("frame.html") ? RuntimeMode.Frame : RuntimeMode.Editor;

Playground.Show(HostElement, CurrentMode, "dev", []);
