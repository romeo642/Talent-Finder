import { o as __toESM } from "../_runtime.mjs";
import { C as require_jsx_runtime, X as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as Shell, o as Route$5 } from "./router-BHsXFbN5.mjs";
import { i as Skeleton, o as controlClass, r as Note, t as Button } from "./ui-DfWWJXEw.mjs";
import { a as searchListings } from "./listings-api-Cu8fGM6-.mjs";
import { t as COUNTRIES } from "./places-Chgsn8D7.mjs";
import { t as SKILL_GROUPS } from "./skills-Dbqw2_5T.mjs";
import { t as Disclaimer } from "./disclaimer-CqjCITOm.mjs";
import { t as ListingCard } from "./listing-card-CDAcsenJ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/find-BB58i9vv.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function FindPage() {
	const initial = Route$5.useSearch();
	const [q, setQ] = (0, import_react.useState)(initial.q ?? "");
	const [country, setCountry] = (0, import_react.useState)("");
	const [region, setRegion] = (0, import_react.useState)("");
	const [town, setTown] = (0, import_react.useState)("");
	const [skill, setSkill] = (0, import_react.useState)("");
	const [listings, setListings] = (0, import_react.useState)(null);
	const [total, setTotal] = (0, import_react.useState)(0);
	const [error, setError] = (0, import_react.useState)("");
	const countryRow = COUNTRIES.find((item) => item.code === country) ?? null;
	const regionRow = countryRow?.regions.find((item) => item.code === region) ?? null;
	(0, import_react.useEffect)(() => {
		let cancel = false;
		setListings(null);
		searchListings({ data: {
			q,
			country,
			region,
			town,
			skill
		} }).then((result) => {
			if (cancel) return;
			if (!result.ok) {
				setError(result.error);
				setListings([]);
				return;
			}
			setError("");
			setListings(result.data.listings);
			setTotal(result.data.total);
		}).catch(() => {
			if (!cancel) {
				setError("Could not load the directory.");
				setListings([]);
			}
		});
		return () => {
			cancel = true;
		};
	}, [
		q,
		country,
		region,
		town,
		skill
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Shell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-title",
			children: "Find a skilled hand"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 max-w-2xl text-muted",
			children: "Filter by place and skill, or paste a TAP ID. Sample profiles are marked and are not real people."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "mt-6 grid gap-3 rounded-card border border-line bg-paper p-4 sm:grid-cols-2",
			onSubmit: (event) => event.preventDefault(),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block sm:col-span-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mb-2 block text-sm font-medium",
						children: "Search"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: q,
						onChange: (event) => setQ(event.target.value),
						placeholder: "Name, town, skill, or TAP ID",
						className: controlClass
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mb-2 block text-sm font-medium",
						children: "Country"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						className: controlClass,
						value: country,
						onChange: (event) => {
							setCountry(event.target.value);
							setRegion("");
							setTown("");
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "",
							children: "All Paystack countries"
						}), COUNTRIES.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: item.code,
							children: item.name
						}, item.code))]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mb-2 block text-sm font-medium",
						children: "Region"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						className: controlClass,
						value: region,
						disabled: !countryRow,
						onChange: (event) => {
							setRegion(event.target.value);
							setTown("");
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "",
							children: "Any region"
						}), countryRow?.regions.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: item.code,
							children: item.name
						}, item.code))]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mb-2 block text-sm font-medium",
						children: "Town"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						className: controlClass,
						value: town,
						disabled: !regionRow,
						onChange: (event) => setTown(event.target.value),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "",
							children: "Any town"
						}), regionRow?.towns.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: item.code,
							children: item.name
						}, item.code))]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mb-2 block text-sm font-medium",
						children: "Skill"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						className: controlClass,
						value: skill,
						onChange: (event) => setSkill(event.target.value),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "",
							children: "All skills"
						}), SKILL_GROUPS.map((group) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("optgroup", {
							label: group.label,
							children: group.skills.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: item.id,
								children: item.name
							}, item.id))
						}, group.id))]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "sm:col-span-2",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						onClick: () => {
							setQ("");
							setCountry("");
							setRegion("");
							setTown("");
							setSkill("");
						},
						children: "Clear filters"
					})
				})
			]
		}),
		error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Note, { children: error })
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-6 text-sm text-muted tabular-nums",
			children: listings === null ? "Looking…" : `${total} ${total === 1 ? "person" : "people"}`
		}),
		listings === null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 grid gap-4 sm:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-72" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-72" })]
		}) : listings.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-4 text-muted",
			children: "No one is listed for that search. Try a wider area, or list yourself."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4 grid gap-4 sm:grid-cols-2",
			children: listings.map((listing) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListingCard, { listing }, listing.id))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-10",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Disclaimer, { compact: true })
		})
	] });
}
//#endregion
export { FindPage as component };
