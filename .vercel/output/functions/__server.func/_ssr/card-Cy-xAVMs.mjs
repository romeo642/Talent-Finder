import { o as __toESM } from "../_runtime.mjs";
import { d as placeLine, f as yearsLabel } from "./directory-BfCJ7WkE.mjs";
import { C as require_jsx_runtime, X as require_react, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as useCurrentUserState, n as Shell, r as cn } from "./router-BHsXFbN5.mjs";
import { a as buttonClass, i as Skeleton, r as Note } from "./ui-DfWWJXEw.mjs";
import { t as SignInPanel } from "./sign-in-panel-D4QikMaw.mjs";
import { i as getMine } from "./listings-api-Cu8fGM6-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/card-Cy-xAVMs.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function CardPage() {
	const { user, isPending } = useCurrentUserState();
	const userId = user?.id;
	const [listing, setListing] = (0, import_react.useState)(void 0);
	const [error, setError] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		if (!userId) return;
		let cancel = false;
		getMine().then((result) => {
			if (cancel) return;
			if (!result.ok) {
				setError(result.error);
				setListing(null);
				return;
			}
			setListing(result.data);
		}).catch(() => {
			if (!cancel) {
				setError("Could not load your ID.");
				setListing(null);
			}
		});
		return () => {
			cancel = true;
		};
	}, [userId]);
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-64" }) });
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignInPanel, {
		title: "Sign in to see your TAP ID",
		callbackURL: "/card"
	}) });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Shell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-title",
			children: "Your TAP ID"
		}),
		error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Note, { children: error })
		}) : null,
		listing === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mt-6 h-64" }) : listing === null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 max-w-lg",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-muted",
				children: "You have not published a listing yet. The Ghana fee is GHS 10, paid through Paystack."
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/list",
				className: cn(buttonClass(), "mt-6"),
				children: "List your work"
			})]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
			className: "mt-6 grid gap-6 md:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: listing.photo,
				alt: "",
				className: "aspect-work w-full rounded-card object-cover"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-card border border-line bg-paper p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-mono text-sm tracking-wide",
						children: listing.id
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-3 font-display text-3xl",
						children: listing.displayName
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-muted",
						children: [
							listing.skillName,
							" · ",
							yearsLabel(listing.years)
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted",
						children: placeLine(listing)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 text-sm",
						children: listing.contactActive && (listing.phone || listing.email) ? [listing.phone, listing.email].filter(Boolean).join(" · ") : "Contact is hidden."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 flex flex-col gap-3 sm:flex-row",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/p/$tapId",
							params: { tapId: listing.id },
							className: buttonClass(),
							children: "View public page"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/list",
							className: buttonClass("secondary"),
							children: "Update"
						})]
					})
				]
			})]
		})
	] });
}
//#endregion
export { CardPage as component };
