import { C as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as cn } from "./router-BHsXFbN5.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ui-DfWWJXEw.js
var import_jsx_runtime = require_jsx_runtime();
function buttonClass(variant = "primary", full = false) {
	return cn("inline-flex h-12 items-center justify-center gap-2 rounded-control px-5 text-sm font-semibold", "transition-opacity duration-150 ease-out", "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent", "disabled:cursor-not-allowed disabled:opacity-50", full && "w-full", variant === "primary" && "bg-accent text-accent-fg hover:opacity-90", variant === "secondary" && "border border-line-strong bg-paper text-ink hover:bg-bg", variant === "ghost" && "bg-transparent text-ink hover:bg-ink/5");
}
function Button({ variant = "primary", full, className, type = "button", ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type,
		className: cn(buttonClass(variant, full), className),
		...props
	});
}
function Field({ label, hint, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "block",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "mb-2 block text-sm font-medium",
				children: label
			}),
			children,
			hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "mt-2 block text-sm text-muted",
				children: hint
			}) : null
		]
	});
}
var controlClass = "h-12 w-full rounded-control border border-line bg-paper px-4 text-base text-ink outline-none placeholder:text-faint focus:border-accent";
function Note({ tone = "danger", children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: cn("rounded-control px-4 py-3 text-sm", tone === "danger" ? "bg-danger-bg text-danger" : "bg-ok-bg text-ok"),
		role: tone === "danger" ? "alert" : "status",
		children
	});
}
function Skeleton({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: cn("animate-pulse rounded-control bg-line", className) });
}
//#endregion
export { buttonClass as a, Skeleton as i, Field as n, controlClass as o, Note as r, Button as t };
