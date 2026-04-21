/**
 * Vite dev server entry point for the Babylon.js Sandbox.
 *
 * Calls Sandbox.Show directly with a minimal version info.
 * For production CDN deployments use: npm run build:deployment -w @tools/sandbox
 */
// Register GLTF/GLB loader (all three sub-loaders + plugin container).
// The sandbox opens .glb/.gltf files directly via SceneLoader, which requires
// GLTFFileLoader._CreateGLTF2Loader to be assigned (side-effect of glTFLoader.js).
import "loaders/glTF/index";
import { Sandbox } from "./index";

const hostElement = document.getElementById("host-element") as HTMLElement;

// Minimal version info — production uses full version from CDN snapshot metadata
Sandbox.Show(hostElement, { version: "dev", bundles: [] });
