import { d as placeLine, f as yearsLabel } from "./directory-BfCJ7WkE.mjs";
import { C as require_jsx_runtime, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/listing-card-CDAcsenJ.js
var import_jsx_runtime = require_jsx_runtime();
function ListingCard({ listing }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to: "/p/$tapId",
		params: { tapId: listing.id },
		className: "block rounded-card border border-line bg-paper p-4 transition-opacity duration-150 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: listing.photo,
			alt: `${listing.displayName}'s work as a ${listing.skillName.toLowerCase()}`,
			className: "aspect-work w-full rounded-control object-cover"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "px-1 pb-1 pt-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-mono text-xs tracking-wide text-muted",
					children: listing.id
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "mt-1 font-display text-2xl leading-tight",
					children: listing.displayName
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-sm",
					children: [
						listing.skillName,
						" · ",
						yearsLabel(listing.years)
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: placeLine(listing)
				}),
				listing.sample ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 inline-flex rounded-control border border-line px-2 py-1 text-xs font-medium text-muted",
					children: "Sample profile"
				}) : null
			]
		})]
	});
}
//#endregion
export { ListingCard as t };
