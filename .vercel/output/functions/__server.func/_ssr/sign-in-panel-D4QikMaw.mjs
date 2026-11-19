import { o as __toESM } from "../_runtime.mjs";
import { C as require_jsx_runtime, X as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as signIn } from "./client-1vAx-gM_.mjs";
import { t as GROK_PROVIDERS } from "./server-wg_dgCQX.mjs";
import { r as Note, t as Button } from "./ui-DfWWJXEw.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/sign-in-panel-D4QikMaw.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function SignInPanel({ title = "Sign in to list your work", callbackURL = "/list" }) {
	const [error, setError] = (0, import_react.useState)("");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto w-full max-w-md rounded-card border border-line bg-paper p-6 sm:p-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-title",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm leading-relaxed text-muted",
				children: "Browsing is open. Sign in only when you publish a TAP ID, so the listing stays on your account."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6 flex flex-col gap-3",
				children: GROK_PROVIDERS.map((provider, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					full: true,
					variant: index === 0 ? "primary" : "secondary",
					onClick: () => {
						setError("");
						signIn(provider.providerId, { callbackURL }).catch(() => {
							setError("Could not open sign-in. Try again.");
						});
					},
					children: ["Continue with ", provider.label]
				}, provider.providerId))
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Note, { children: error })
			}) : null
		]
	});
}
//#endregion
export { SignInPanel as t };
