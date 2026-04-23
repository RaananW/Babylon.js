// Export all named symbols directly so ADDONS.HtmlMesh etc. work.
// With Rollup UMD (unlike webpack's libraryExport:"default"), named exports must be
// explicitly re-exported for them to appear on the global namespace object.
export * from "addons/index";

import * as addons from "addons/index";
export { addons };
export default addons;
