/**
 * Vite dev server entry point for the Visual State Manager.
 *
 * For production CDN deployments use: npm run build:deployment -w @tools/vsm
 */
import { VSM } from "./index";

const hostElement = document.getElementById("host-element") as HTMLElement;

VSM.Show({ hostElement });
