import { o as __toESM } from "../_runtime.mjs";
import { C as require_jsx_runtime, X as require_react, x as useNavigate, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as Shell } from "./router-BHsXFbN5.mjs";
import { a as buttonClass, i as Skeleton, t as Button } from "./ui-DfWWJXEw.mjs";
import { a as searchListings } from "./listings-api-Cu8fGM6-.mjs";
import { t as COUNTRIES } from "./places-Chgsn8D7.mjs";
import { t as Disclaimer } from "./disclaimer-CqjCITOm.mjs";
import { t as ListingCard } from "./listing-card-CDAcsenJ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DvVWBSMv.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Home() {
	const navigate = useNavigate();
	const [query, setQuery] = (0, import_react.useState)("");
	const [listings, setListings] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		let cancel = false;
		searchListings({ data: {} }).then((result) => {
			if (cancel) return;
			setListings(result.ok ? result.data.listings.slice(0, 6) : []);
		}).catch(() => {
			if (!cancel) setListings([]);
		});
		return () => {
			cancel = true;
		};
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Shell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "grid items-center gap-8 md:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-medium text-muted",
					children: "Skilled hands, with an ID you can check"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-3 font-display text-hero text-ink",
					children: "A work ID for every skilled hand."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 max-w-md text-lg leading-relaxed text-muted",
					children: "Pay a small listing fee through Paystack, upload a photo of your best job, and get an ID built from your country, region, town, and community. Households open TAP, scan your QR, and use the phone or email you leave on."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "mt-6 flex flex-col gap-3 sm:flex-row",
					onSubmit: (event) => {
						event.preventDefault();
						navigate({
							to: "/find",
							search: { q: query.trim() }
						});
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "sr-only",
							htmlFor: "home-search",
							children: "Search skills, towns, or a TAP ID"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							id: "home-search",
							value: query,
							onChange: (event) => setQuery(event.target.value),
							placeholder: "Painter in Osu, or a TAP ID",
							className: "h-12 w-full rounded-control border border-line bg-paper px-4 text-base outline-none placeholder:text-faint focus:border-accent"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							children: "Find someone"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4 flex flex-col gap-3 sm:flex-row",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/list",
						className: buttonClass("secondary"),
						children: "List your work · GHS 10"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 max-w-md text-sm leading-relaxed text-muted",
					children: "Adults only. Ghana is GHS 10. Nigeria, Kenya, South Africa, and Côte d'Ivoire pay a local fee on Paystack. TAP does not take a cut of the job."
				})
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", {
				className: "relative",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: "/samples/painter.jpg",
					alt: "A freshly painted room, the kind of work a TAP listing shows",
					className: "aspect-work w-full rounded-card object-cover"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figcaption", {
					className: "absolute inset-x-4 bottom-4 rounded-control bg-paper p-4 shadow-lift",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-mono text-xs tracking-wide text-muted",
							children: "GH-GA-ACC-OSU-0001"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 font-display text-2xl leading-tight",
							children: "Ama Mensah"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted",
							children: "Painter · 11 years · Osu, Accra"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-xs font-medium text-faint",
							children: "Sample listing"
						})
					]
				})]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
			className: "mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
			children: [
				[
					"1",
					"Choose your place",
					"Country, region, town, then the community you actually work in."
				],
				[
					"2",
					"Show your best work",
					"One photo, your years on the job, and a plain description."
				],
				[
					"3",
					"Pay with Paystack",
					"Mobile money, QR, transfer, or card. The methods depend on your country."
				],
				[
					"4",
					"Share your TAP ID",
					"Clients open the ID, see the work, and call or email if you left contact on."
				]
			].map(([n, title, body]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
				className: "rounded-card border border-line bg-paper p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-mono text-sm text-muted",
						children: n
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-3 font-display text-2xl leading-tight",
						children: title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm leading-relaxed text-muted",
						children: body
					})
				]
			}, n))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mt-16",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-title",
					children: "Only where Paystack pays"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 max-w-2xl text-muted",
					children: "TAP is limited to African countries Paystack serves. You pick your country first. The fee is charged in that country's currency."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-6 divide-y divide-line rounded-card border border-line bg-paper",
					children: COUNTRIES.map((country) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-medium",
							children: country.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: country.rails
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-mono text-sm tabular-nums",
							children: country.feeLabel
						})]
					}, country.code))
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mt-16",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-end justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-title",
					children: "People on TAP"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/find",
					className: "text-sm font-semibold text-accent",
					children: "Browse all"
				})]
			}), listings === null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-72" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-72" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "hidden h-72 lg:block" })
				]
			}) : listings.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6 text-muted",
				children: "No listings yet. Be the first to publish your work."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
				children: listings.map((listing) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListingCard, { listing }, listing.id))
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-16",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Disclaimer, {})
		})
	] });
}
//#endregion
export { Home as component };
