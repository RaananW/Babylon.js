// Export all named symbols directly so BABYLON.GUI.AdvancedDynamicTexture etc. work.
// With Rollup UMD (unlike webpack's libraryExport:"default"), named exports must be
// explicitly re-exported for them to appear on the global namespace object.
export * from "gui/legacy/legacy";

import * as gui from "gui/legacy/legacy";
export { gui };
export default gui;
