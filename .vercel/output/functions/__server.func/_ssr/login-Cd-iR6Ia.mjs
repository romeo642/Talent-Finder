import { C as require_jsx_runtime, b as Navigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as useCurrentUserState, n as Shell } from "./router-BHsXFbN5.mjs";
import { i as Skeleton } from "./ui-DfWWJXEw.mjs";
import { t as SignInPanel } from "./sign-in-panel-D4QikMaw.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-Cd-iR6Ia.js
var import_jsx_runtime = require_jsx_runtime();
function LoginPage() {
	const { user, isPending } = useCurrentUserState();
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mx-auto h-64 max-w-md" }) });
	if (user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/card" });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignInPanel, { callbackURL: "/card" }) });
}
//#endregion
export { LoginPage as component };
