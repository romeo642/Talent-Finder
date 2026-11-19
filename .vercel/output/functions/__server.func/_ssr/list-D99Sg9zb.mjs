import { o as __toESM } from "../_runtime.mjs";
import { f as yearsLabel, t as DUE_DILIGENCE } from "./directory-BfCJ7WkE.mjs";
import { C as require_jsx_runtime, X as require_react, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as useCurrentUserState, n as Shell, r as cn } from "./router-BHsXFbN5.mjs";
import { a as buttonClass, i as Skeleton, n as Field, o as controlClass, r as Note, t as Button } from "./ui-DfWWJXEw.mjs";
import { t as SignInPanel } from "./sign-in-panel-D4QikMaw.mjs";
import { i as getMine, o as submitListing, t as confirmPreview } from "./listings-api-Cu8fGM6-.mjs";
import { t as COUNTRIES } from "./places-Chgsn8D7.mjs";
import { n as skillById, t as SKILL_GROUPS } from "./skills-Dbqw2_5T.mjs";
import { n as methodsFor, t as methodById } from "./payments-76JHCcMR.mjs";
import { t as QrMark } from "./qr-mark-DRH6EJdb.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/list-D99Sg9zb.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
async function compressPhoto(file) {
	if (!file.type.startsWith("image/")) throw new Error("Choose a photo.");
	if (file.size > 12582912) throw new Error("That photo is larger than 12 MB.");
	let bitmap;
	try {
		bitmap = await createImageBitmap(file);
	} catch {
		throw new Error("Use a JPG or PNG photo.");
	}
	const scale = Math.min(1, 960 / Math.max(bitmap.width, bitmap.height));
	const width = Math.max(1, Math.round(bitmap.width * scale));
	const height = Math.max(1, Math.round(bitmap.height * scale));
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Could not read that photo.");
	ctx.drawImage(bitmap, 0, 0, width, height);
	bitmap.close();
	let url = canvas.toDataURL("image/jpeg", .72);
	if (url.length > 35e4) url = canvas.toDataURL("image/jpeg", .55);
	if (url.length > 38e4) throw new Error("That photo is still too large. Try a simpler picture.");
	return url;
}
var EMPTY = {
	countryCode: "GH",
	regionCode: "",
	townCode: "",
	communityCode: "",
	skillId: "",
	years: 3,
	displayName: "",
	phone: "",
	email: "",
	whatsappSame: true,
	reach: "",
	contactActive: true,
	payMethod: "mtn",
	experience: "",
	photo: "",
	acceptDisclaimer: false
};
function fromListing(listing) {
	return {
		countryCode: listing.countryCode,
		regionCode: listing.regionCode,
		townCode: listing.townCode,
		communityCode: listing.communityCode,
		skillId: listing.skillId,
		years: listing.years,
		displayName: listing.displayName,
		phone: listing.phone ?? "",
		email: listing.email ?? "",
		whatsappSame: Boolean(listing.whatsapp),
		reach: listing.reach ?? "",
		contactActive: listing.contactActive,
		payMethod: methodsFor(listing.countryCode)[0]?.id ?? "mtn",
		experience: listing.experience,
		photo: listing.photo,
		acceptDisclaimer: false
	};
}
function ListPage() {
	const { user, isPending } = useCurrentUserState();
	const userId = user?.id;
	const [existing, setExisting] = (0, import_react.useState)(null);
	const [ready, setReady] = (0, import_react.useState)(false);
	const [loadError, setLoadError] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		if (!userId) return;
		let cancel = false;
		getMine().then((result) => {
			if (cancel) return;
			if (!result.ok) setLoadError(result.error);
			else setExisting(result.data);
			setReady(true);
		}).catch(() => {
			if (!cancel) {
				setLoadError("Could not load your listing.");
				setReady(true);
			}
		});
		return () => {
			cancel = true;
		};
	}, [userId]);
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-80" }) });
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignInPanel, {}) });
	if (!ready) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-80" }) });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Shell, { children: [loadError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mb-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Note, { children: loadError })
	}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wizard, { existing })] });
}
function Wizard({ existing }) {
	const [adult, setAdult] = (0, import_react.useState)("unknown");
	const [step, setStep] = (0, import_react.useState)(0);
	const [form, setForm] = (0, import_react.useState)(existing ? fromListing(existing) : EMPTY);
	const [skillQuery, setSkillQuery] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)("");
	const [checkout, setCheckout] = (0, import_react.useState)(null);
	const [published, setPublished] = (0, import_react.useState)(null);
	const [updated, setUpdated] = (0, import_react.useState)(false);
	const country = COUNTRIES.find((item) => item.code === form.countryCode) ?? COUNTRIES[0];
	const region = country.regions.find((item) => item.code === form.regionCode) ?? null;
	const town = region?.towns.find((item) => item.code === form.townCode) ?? null;
	const community = town?.communities.find((item) => item.code === form.communityCode) ?? null;
	const skill = skillById(form.skillId);
	const groups = (0, import_react.useMemo)(() => {
		const q = skillQuery.trim().toLowerCase();
		return SKILL_GROUPS.map((group) => ({
			...group,
			skills: group.skills.filter((item) => !q || item.name.toLowerCase().includes(q))
		})).filter((group) => group.skills.length > 0);
	}, [skillQuery]);
	function patch(partial) {
		setForm((current) => ({
			...current,
			...partial
		}));
		setError("");
	}
	function next() {
		if (step === 0 && (!region || !town || !community)) {
			setError("Select your region, town, and community.");
			return;
		}
		if (step === 1 && !skill) {
			setError("Select the skill you want to be found for.");
			return;
		}
		if (step === 2) {
			if (!form.photo) {
				setError("Upload a photo of your best work.");
				return;
			}
			if (form.experience.trim().length < 40) {
				setError("Describe the work in at least 40 characters.");
				return;
			}
		}
		if (step === 3) {
			if (form.displayName.trim().length < 2) {
				setError("Enter the name clients should see.");
				return;
			}
		}
		setError("");
		setStep((value) => Math.min(4, value + 1));
	}
	async function publish() {
		if (!form.acceptDisclaimer) {
			setError("Confirm the due diligence notice before you continue.");
			return;
		}
		setBusy(existing ? "Saving your listing…" : "Checking your listing…");
		setError("");
		const result = await submitListing({ data: {
			...form,
			adult: true,
			origin: window.location.origin
		} });
		setBusy("");
		if (!result.ok) {
			setError(result.error);
			return;
		}
		if (result.data.status === "published") {
			setUpdated(result.data.updated);
			setPublished(result.data.listing);
			return;
		}
		if (result.data.status === "paystack") {
			const url = result.data.authorizationUrl;
			if (result.data.qr) {
				setCheckout({
					reference: result.data.reference,
					feeLabel: result.data.feeLabel,
					payMethod: result.data.payMethod,
					qr: true,
					url,
					live: true
				});
				return;
			}
			window.location.assign(url);
			return;
		}
		setCheckout({
			reference: result.data.reference,
			feeLabel: result.data.feeLabel,
			payMethod: result.data.payMethod,
			qr: result.data.qr,
			url: `${window.location.origin}/pay/callback?reference=${encodeURIComponent(result.data.reference)}&preview=1`,
			live: false
		});
	}
	async function confirm() {
		if (!checkout) return;
		setBusy("Publishing your ID…");
		setError("");
		const result = await confirmPreview({ data: { reference: checkout.reference } });
		setBusy("");
		if (!result.ok) {
			setError(result.error);
			return;
		}
		setCheckout(null);
		setPublished(result.data);
	}
	if (adult === "unknown") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mx-auto max-w-lg rounded-card border border-line bg-paper p-6 sm:p-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm font-medium text-muted",
				children: "Security check"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-2 font-display text-title",
				children: "Are you 18 or older?"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm leading-relaxed text-muted",
				children: "TAP only publishes listings from adults. You cannot create an ID if you are under 18."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 flex flex-col gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: () => setAdult("yes"),
					children: "Yes, I am 18 or older"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "secondary",
					onClick: () => setAdult("no"),
					children: "No, I am under 18"
				})]
			})
		]
	});
	if (adult === "no") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mx-auto max-w-lg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-title",
				children: "You can't create a TAP ID yet"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-muted",
				children: "This directory is limited to people who are 18 or older."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				className: "mt-6 inline-flex text-sm font-semibold text-accent",
				children: "Back home"
			})
		]
	});
	if (published) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mx-auto max-w-lg rounded-card border border-line bg-paper p-6 sm:p-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm font-medium text-muted",
				children: updated ? "Listing updated" : "ID issued"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-2 font-display text-title",
				children: published.displayName
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 font-mono text-lg tracking-wide",
				children: published.id
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-sm text-muted",
				children: [
					published.skillName,
					" · ",
					yearsLabel(published.years)
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted",
				children: "Country, region, town, community, then your number. Share this ID with anyone hiring."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 flex flex-col gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/p/$tapId",
					params: { tapId: published.id },
					className: buttonClass("primary", true),
					children: "Open your public page"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/card",
					className: buttonClass("secondary", true),
					children: "Go to my ID"
				})]
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "text-sm font-medium text-muted",
			children: [
				existing ? `Updating ${existing.id}` : "New listing",
				" · step ",
				step + 1,
				" of 5"
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "mt-2 font-display text-title",
			children: [
				"Where you work",
				"Your skill",
				"Your best work",
				"How to reach you",
				"Review and pay"
			][step]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4 h-1 overflow-hidden rounded-full bg-line",
			role: "progressbar",
			"aria-valuemin": 1,
			"aria-valuemax": 5,
			"aria-valuenow": step + 1,
			"aria-label": "Listing progress",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "h-full w-full origin-left rounded-full bg-accent transition-transform duration-300 ease-out",
				style: { transform: `scaleX(${(step + 1) / 5})` }
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 rounded-card border border-line bg-paper p-4 sm:p-6",
			children: [
				step === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Country",
							hint: "Only countries where Paystack takes payments.",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
								className: controlClass,
								value: form.countryCode,
								onChange: (event) => patch({
									countryCode: event.target.value,
									regionCode: "",
									townCode: "",
									communityCode: "",
									payMethod: methodsFor(event.target.value)[0]?.id ?? "mtn"
								}),
								children: COUNTRIES.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
									value: item.code,
									children: [
										item.name,
										" · ",
										item.feeLabel
									]
								}, item.code))
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Region",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								className: controlClass,
								value: form.regionCode,
								onChange: (event) => patch({
									regionCode: event.target.value,
									townCode: "",
									communityCode: ""
								}),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "",
									children: "Select a region"
								}), country.regions.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: item.code,
									children: item.name
								}, item.code))]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Town",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								className: controlClass,
								value: form.townCode,
								disabled: !region,
								onChange: (event) => patch({
									townCode: event.target.value,
									communityCode: ""
								}),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "",
									children: "Select a town"
								}), region?.towns.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: item.code,
									children: item.name
								}, item.code))]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Community",
							hint: "This becomes part of your TAP ID.",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								className: controlClass,
								value: form.communityCode,
								disabled: !town,
								onChange: (event) => patch({ communityCode: event.target.value }),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "",
									children: "Select a community"
								}), town?.communities.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: item.code,
									children: item.name
								}, item.code))]
							})
						})
					]
				}) : null,
				step === 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Years of experience",
							hint: yearsLabel(form.years),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "secondary",
										onClick: () => patch({ years: Math.max(0, form.years - 1) }),
										"aria-label": "Fewer years",
										children: "−"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "min-w-12 text-center font-mono text-3xl tabular-nums",
										children: form.years
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "secondary",
										onClick: () => patch({ years: Math.min(50, form.years + 1) }),
										"aria-label": "More years",
										children: "+"
									})
								]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Skill",
							hint: "Search the list. Pick the title clients would look for.",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: skillQuery,
								onChange: (event) => setSkillQuery(event.target.value),
								placeholder: "Search skills",
								className: controlClass
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "max-h-80 overflow-auto rounded-control border border-line",
							children: [groups.map((group) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "sticky top-0 bg-bg px-3 py-2 text-xs font-medium text-muted",
								children: group.label
							}), group.skills.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-pressed": form.skillId === item.id,
								onClick: () => patch({ skillId: item.id }),
								className: cn("flex h-11 w-full items-center px-3 text-left text-sm", form.skillId === item.id ? "bg-accent text-accent-fg" : "hover:bg-bg"),
								children: item.name
							}, item.id))] }, group.id)), groups.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "p-4 text-sm text-muted",
								children: "No skill matches that search."
							}) : null]
						})
					]
				}) : null,
				step === 2 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Photo of your best work",
							hint: "A job, a tool, or the finished work. Not a nude or unrelated picture.",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "file",
								accept: "image/jpeg,image/png,image/webp",
								className: "block w-full text-sm file:mr-3 file:h-11 file:rounded-control file:border-0 file:bg-accent file:px-4 file:text-sm file:font-semibold file:text-accent-fg",
								onChange: (event) => {
									const file = event.target.files?.[0];
									if (!file) return;
									setBusy("Preparing photo…");
									compressPhoto(file).then((photo) => {
										patch({ photo });
										setBusy("");
									}).catch((reason) => {
										setBusy("");
										setError(reason instanceof Error ? reason.message : "Could not read that photo.");
									});
								}
							})
						}),
						form.photo ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: form.photo,
							alt: "Your best work",
							className: "aspect-work w-full rounded-control object-cover"
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "What you do",
							hint: `${form.experience.trim().length}/800`,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								value: form.experience,
								maxLength: 800,
								onChange: (event) => patch({ experience: event.target.value }),
								className: "min-h-36 w-full rounded-control border border-line bg-paper p-4 text-base outline-none focus:border-accent",
								placeholder: "The jobs you take, where you work, and what a client should expect."
							})
						})
					]
				}) : null,
				step === 3 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Name",
							hint: "The name on your TAP ID.",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: form.displayName,
								onChange: (event) => patch({ displayName: event.target.value }),
								className: controlClass,
								autoComplete: "name"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Phone",
							hint: "Optional. Shown only if contact is on.",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: form.phone,
								onChange: (event) => patch({ phone: event.target.value }),
								className: controlClass,
								inputMode: "tel",
								autoComplete: "tel",
								placeholder: "Local mobile number"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Email",
							hint: "Optional. Also used for a Paystack receipt when checkout is live.",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: form.email,
								onChange: (event) => patch({ email: event.target.value }),
								className: controlClass,
								inputMode: "email",
								autoComplete: "email",
								placeholder: "name@email.com"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
							checked: form.whatsappSame,
							label: "WhatsApp is this phone",
							hint: "Uses the phone above. Off if you left the phone blank.",
							onChange: (whatsappSame) => patch({ whatsappSame })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Where people find you",
							hint: "Optional. A stall, a gate, or a market day.",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								value: form.reach,
								maxLength: 180,
								onChange: (event) => patch({ reach: event.target.value }),
								className: "min-h-24 w-full rounded-control border border-line bg-paper p-4 text-base outline-none focus:border-accent",
								placeholder: "Saturday mornings at the Labone flower stall"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
							checked: form.contactActive,
							label: "Show contact",
							hint: "Turn this off to hide the phone, email, WhatsApp, and meeting note.",
							onChange: (contactActive) => patch({ contactActive })
						})
					]
				}) : null,
				step === 4 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-4",
					children: [
						form.photo ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: form.photo,
							alt: "",
							className: "aspect-work w-full rounded-control object-cover"
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
							className: "grid gap-3 text-sm sm:grid-cols-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
									className: "text-muted",
									children: "Place"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", { children: [
									community?.name,
									", ",
									town?.name,
									", ",
									region?.name,
									", ",
									country.name
								] })] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
									className: "text-muted",
									children: "Skill"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", { children: [
									skill?.name ?? "—",
									" · ",
									yearsLabel(form.years)
								] })] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
									className: "text-muted",
									children: "Name"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: form.displayName || "—" })] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
									className: "text-muted",
									children: "Contact"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: form.contactActive ? [
									form.phone,
									form.email,
									form.reach
								].filter((item) => item.trim()).join(" · ") || "Nothing listed" : "Hidden" })] })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm leading-relaxed text-muted",
							children: form.experience
						}),
						existing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm text-muted",
							children: [
								"No new fee. Your ID stays ",
								existing.id,
								". Updating your place does not change the ID."
							]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm",
								children: [
									"Listing fee ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-mono tabular-nums",
										children: country.feeLabel
									}),
									". Pick how you will pay. Paystack opens that method. TAP never asks for a card number."
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid gap-2 sm:grid-cols-2",
								children: methodsFor(country.code).map((method) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									"aria-pressed": form.payMethod === method.id,
									onClick: () => patch({ payMethod: method.id }),
									className: cn("rounded-control border px-3 py-3 text-left", form.payMethod === method.id ? "border-accent bg-accent text-accent-fg" : "border-line bg-paper"),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "block text-sm font-semibold",
										children: method.label
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: cn("mt-1 block text-xs", form.payMethod === method.id ? "text-accent-fg" : "text-muted"),
										children: method.detail
									})]
								}, method.id))
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex items-start gap-3 text-sm leading-relaxed",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								className: "mt-1 size-5 accent-accent",
								checked: form.acceptDisclaimer,
								onChange: (event) => patch({ acceptDisclaimer: event.target.checked })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["I am 18 or older, and I understand this: ", DUE_DILIGENCE] })]
						}),
						checkout ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-control border border-line bg-bg p-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "font-medium",
									children: [
										methodById(country.code, checkout.payMethod)?.label ?? "Paystack",
										" · ",
										checkout.feeLabel
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-sm leading-relaxed text-muted",
									children: checkout.live ? "Scan the code or open Paystack to finish. TAP does not collect the wallet PIN or the card." : "This preview does not charge you. Scan the code on your phone, or confirm here. No card number is collected."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-4",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QrMark, {
										text: checkout.url,
										caption: checkout.qr ? "Paystack QR" : "Open this checkout"
									})
								}),
								checkout.live ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									className: cn(buttonClass(), "mt-4"),
									href: checkout.url,
									children: "Open Paystack"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									className: "mt-4",
									full: true,
									disabled: Boolean(busy),
									onClick: () => void confirm(),
									children: busy || `Confirm ${checkout.feeLabel}`
								})
							]
						}) : null
					]
				}) : null,
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Note, { children: error })
				}) : null,
				busy && !checkout ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-sm text-muted",
					children: busy
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						disabled: step === 0 || Boolean(busy),
						onClick: () => setStep((value) => value - 1),
						children: "Back"
					}), step < 4 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: next,
						children: "Continue"
					}) : checkout ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						disabled: Boolean(busy),
						onClick: () => void publish(),
						children: busy || (existing ? "Save changes" : "Continue to Paystack")
					})]
				})
			]
		})
	] });
}
function Switch({ checked, label, hint, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-start justify-between gap-4 rounded-control border border-line px-4 py-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "block text-sm font-medium",
			children: label
		}), hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "mt-1 block text-sm text-muted",
			children: hint
		}) : null] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			role: "switch",
			"aria-checked": checked,
			onClick: () => onChange(!checked),
			className: cn("relative h-8 w-14 shrink-0 rounded-full transition-colors duration-150", checked ? "bg-accent" : "bg-line-strong"),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("absolute top-1 size-6 rounded-full bg-paper transition-transform duration-150", checked ? "translate-x-7" : "translate-x-1") })
		})]
	});
}
//#endregion
export { ListPage as component };
