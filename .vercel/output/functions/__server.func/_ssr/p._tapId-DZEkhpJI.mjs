import { o as __toESM } from "../_runtime.mjs";
import { d as placeLine, f as yearsLabel, l as idMoved, o as formatPhone } from "./directory-BfCJ7WkE.mjs";
import { C as require_jsx_runtime, X as require_react, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Route$2, n as Shell } from "./router-BHsXFbN5.mjs";
import { a as buttonClass, i as Skeleton, r as Note, t as Button } from "./ui-DfWWJXEw.mjs";
import { r as getListing } from "./listings-api-Cu8fGM6-.mjs";
import { t as Disclaimer } from "./disclaimer-CqjCITOm.mjs";
import { t as QrMark } from "./qr-mark-DRH6EJdb.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/p._tapId-DZEkhpJI.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ProfilePage() {
	const { tapId } = Route$2.useParams();
	const [listing, setListing] = (0, import_react.useState)(void 0);
	const [error, setError] = (0, import_react.useState)("");
	const [copied, setCopied] = (0, import_react.useState)(false);
	const [shareUrl, setShareUrl] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		let cancel = false;
		setListing(void 0);
		getListing({ data: { id: tapId } }).then((result) => {
			if (cancel) return;
			if (!result.ok) {
				setError(result.error);
				setListing(null);
				return;
			}
			setListing(result.data);
		}).catch(() => {
			if (!cancel) {
				setError("Could not open this ID.");
				setListing(null);
			}
		});
		return () => {
			cancel = true;
		};
	}, [tapId]);
	(0, import_react.useEffect)(() => {
		setShareUrl(window.location.href);
	}, [tapId]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: listing === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-4 md:grid-cols-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-80" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-80" })]
	}) : listing === null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-title",
			children: "No listing for that ID"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 text-muted",
			children: "Check the code, or search by town and skill."
		}),
		error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Note, { children: error })
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: "/find",
			className: "mt-6 inline-flex text-sm font-semibold text-accent",
			children: "Browse the directory"
		})
	] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "grid gap-6 md:grid-cols-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: listing.photo,
				alt: `${listing.displayName}'s best work as a ${listing.skillName.toLowerCase()}`,
				className: "aspect-work w-full rounded-card object-cover"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-medium text-muted",
					children: listing.skillName
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 font-display text-title",
					children: listing.displayName
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 text-muted",
					children: [
						yearsLabel(listing.years),
						" · ",
						placeLine(listing)
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-5 font-mono text-sm tracking-wide text-ink",
					children: listing.id
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-xs text-muted",
					children: "Country · region · town · community · number"
				}),
				idMoved(listing) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: "This ID was issued for an earlier place and does not change if they move. The location above is current."
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						onClick: () => {
							navigator.clipboard.writeText(listing.id).then(() => {
								setCopied(true);
							});
						},
						children: copied ? "Copied" : "Copy ID"
					})
				}),
				listing.sample ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-sm text-muted",
					children: "Sample profile. This is not a real person."
				}) : null
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "md:col-span-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl",
					children: "Experience"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 max-w-3xl leading-relaxed",
					children: listing.experience
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-card border border-line bg-paper p-5 md:col-span-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-2xl",
						children: "Contact"
					}),
					listing.sample ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm text-muted",
						children: "Hidden on sample profiles. This is not a real person."
					}) : !listing.contactActive || !listing.phone && !listing.email && !listing.reach ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm text-muted",
						children: "No phone or email is listed. Use the place on this ID, and do your own checks."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex flex-col gap-3",
						children: [
							listing.phone ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								className: buttonClass(),
								href: `tel:${listing.phone}`,
								children: formatPhone(listing.phone)
							}) : null,
							listing.whatsapp ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								className: buttonClass("secondary"),
								href: `https://wa.me/${listing.whatsapp.replace(/\D/g, "")}`,
								target: "_blank",
								rel: "noreferrer",
								children: "WhatsApp"
							}) : null,
							listing.email ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								className: buttonClass("secondary"),
								href: `mailto:${listing.email}`,
								children: listing.email
							}) : null,
							listing.reach ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm leading-relaxed",
								children: listing.reach
							}) : null
						]
					}),
					shareUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-5",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QrMark, {
							text: shareUrl,
							caption: "Scan to open this TAP ID"
						})
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "md:col-span-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Disclaimer, { compact: true })
			})
		]
	}) });
}
//#endregion
export { ProfilePage as component };
