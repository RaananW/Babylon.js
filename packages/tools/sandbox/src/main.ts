/**
 * Vite dev server entry point for the Babylon.js Sandbox.
 *
 * Calls Sandbox.Show directly with a minimal version info.
 * For production CDN deployments use: npm run build:deployment -w @tools/sandbox
 */
// Register GLTF/GLB loader (2.0 sub-loader assigns GLTFFileLoader._CreateGLTF2Loader).
// The sandbox loads .glb/.gltf files directly via SceneLoader.
import "loaders/glTF/2.0/glTFLoader";
import { Sandbox } from "./sandbox";

const HostElement = document.getElementById("host-element") as HTMLElement;

// Minimal version info — production uses full version from CDN snapshot metadata
Sandbox.Show(HostElement, { version: "dev", bundles: [] });
