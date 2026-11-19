import { t as DUE_DILIGENCE } from "./directory-BfCJ7WkE.mjs";
import { C as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/disclaimer-CqjCITOm.js
var import_jsx_runtime = require_jsx_runtime();
function Disclaimer({ compact = false }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-card bg-accent px-5 py-6 text-accent-fg sm:px-8 sm:py-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "font-display text-title",
			children: "Due diligence"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: compact ? "mt-3 text-sm leading-relaxed" : "mt-3 max-w-3xl leading-relaxed",
			children: DUE_DILIGENCE
		})]
	});
}
//#endregion
export { Disclaimer as t };
