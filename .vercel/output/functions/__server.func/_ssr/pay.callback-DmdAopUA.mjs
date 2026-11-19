import { o as __toESM } from "../_runtime.mjs";
import { C as require_jsx_runtime, X as require_react, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as useCurrentUserState, n as Shell, r as cn } from "./router-BHsXFbN5.mjs";
import { a as buttonClass, i as Skeleton, r as Note } from "./ui-DfWWJXEw.mjs";
import { t as SignInPanel } from "./sign-in-panel-D4QikMaw.mjs";
import { n as finalizePaystack, t as confirmPreview } from "./listings-api-Cu8fGM6-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/pay.callback-DmdAopUA.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function CallbackPage() {
	const { user, isPending } = useCurrentUserState();
	const userId = user?.id;
	const [listing, setListing] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)("");
	const [working, setWorking] = (0, import_react.useState)(true);
	const [callbackURL, setCallbackURL] = (0, import_react.useState)("/pay/callback");
	(0, import_react.useEffect)(() => {
		setCallbackURL(`/pay/callback${window.location.search}`);
	}, []);
	(0, import_react.useEffect)(() => {
		if (!userId) return;
		const params = new URLSearchParams(window.location.search);
		const reference = params.get("reference") ?? params.get("trxref") ?? "";
		const preview = params.get("preview") === "1";
		if (!reference) {
			setWorking(false);
			setError("Missing payment reference.");
			return;
		}
		let cancel = false;
		(preview ? confirmPreview({ data: { reference } }) : finalizePaystack({ data: { reference } })).then((result) => {
			if (cancel) return;
			setWorking(false);
			if (!result.ok) {
				setError(result.error);
				return;
			}
			setListing(result.data);
		}).catch(() => {
			if (!cancel) {
				setWorking(false);
				setError("Could not confirm the Paystack payment.");
			}
		});
		return () => {
			cancel = true;
		};
	}, [userId]);
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-48" }) });
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignInPanel, {
		title: "Sign in to finish your listing",
		callbackURL
	}) });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Shell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-title",
			children: listing ? "Your TAP ID is live" : "Payment"
		}),
		working ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mt-6 h-32" }) : null,
		error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-6 max-w-lg",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Note, { children: error })
		}) : null,
		listing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 max-w-lg rounded-card border border-line bg-paper p-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-mono text-lg tracking-wide",
					children: listing.id
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-3 text-sm text-muted",
					children: [
						listing.displayName,
						" · ",
						listing.skillName
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/p/$tapId",
					params: { tapId: listing.id },
					className: cn(buttonClass(), "mt-6"),
					children: "Open your public page"
				})
			]
		}) : null
	] });
}
//#endregion
export { CallbackPage as component };
