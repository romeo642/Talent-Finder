import { c as getSql, i as cleanReach, n as cleanEmail, r as cleanName, u as normalizePhone } from "./directory-BfCJ7WkE.mjs";
import { i as TSS_SERVER_FUNCTION, r as createServerFn } from "./ssr.mjs";
import { t as authMiddleware } from "./middleware-B2TkA9Mi.mjs";
import { i as placeKey, n as locateByName, r as placeByCodes } from "./places-Chgsn8D7.mjs";
import { n as skillById } from "./skills-Dbqw2_5T.mjs";
import { t as methodById } from "./payments-76JHCcMR.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/listings-api-BrEKiN_Y.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var BANNED = [
	"fuck",
	"fucker",
	"fucking",
	"motherfucker",
	"shit",
	"shitty",
	"bitch",
	"bastard",
	"asshole",
	"cunt",
	"dick",
	"cock",
	"pussy",
	"whore",
	"slut",
	"porn",
	"porno",
	"nude",
	"nudes",
	"xxx",
	"rape",
	"rapist",
	"nigga",
	"nigger",
	"faggot",
	"fag",
	"retard",
	"blowjob",
	"handjob",
	"escort",
	"hookup",
	"ashawo",
	"prostitut"
];
var STEMS = [
	"prostitut",
	"pornograph",
	"childporn"
];
function normalize(input) {
	return input.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[@4]/g, "a").replace(/3/g, "e").replace(/[1!|]/g, "i").replace(/0/g, "o").replace(/[5$]/g, "s").replace(/7/g, "t").replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();
}
function joinSpacedLetters(value) {
	return value.replace(/\b(?:[a-z]\s+){2,}[a-z]\b/g, (match) => match.replace(/\s+/g, ""));
}
/** Returns true when public text should be rejected. Does not echo the match. */
function hasProfanity(input) {
	const base = joinSpacedLetters(normalize(input));
	const haystacks = [base, base.replace(/(.)\1{2,}/g, "$1")];
	for (const hay of haystacks) {
		if (STEMS.some((stem) => hay.includes(stem))) return true;
		for (const word of BANNED) if (new RegExp(`\\b${word}\\b`, "i").test(hay)) return true;
	}
	return false;
}
var SAMPLES = [
	{
		countryCode: "GH",
		regionCode: "GA",
		townName: "Accra",
		communityName: "Osu",
		skillId: "painter",
		years: 11,
		displayName: "Ama Mensah",
		photo: "/samples/painter.jpg",
		experience: "I paint homes and small offices around Osu, Labone and Cantonments. Interior walls, exterior weather coating, and clean line work on gates. I bring my own brushes and agree the colour with you before I open a tin."
	},
	{
		countryCode: "GH",
		regionCode: "AH",
		townName: "Kumasi",
		communityName: "Adum",
		skillId: "ac-repair",
		years: 8,
		displayName: "Kwame Boateng",
		photo: "/samples/ac.jpg",
		experience: "I service and repair split air conditioners for homes and shops. Gas refill, drainage, and noisy indoor units. I work across Adum, Bantama and Asokwa and I show you the fault before I replace a part."
	},
	{
		countryCode: "NG",
		regionCode: "LA",
		townName: "Ikeja",
		communityName: "Allen",
		skillId: "hairstylist",
		years: 6,
		displayName: "Aisha Bello",
		photo: "/samples/braids.jpg",
		experience: "Braids, twists, and natural hair care from a chair in Allen. I take appointments and I bring my own products if you would rather not buy them. The work I am proudest of is neat cornrows that last the month."
	},
	{
		countryCode: "NG",
		regionCode: "FC",
		townName: "Abuja",
		communityName: "Wuse",
		skillId: "electrician",
		years: 14,
		displayName: "Chinedu Okafor",
		photo: "/samples/electrician.jpg",
		experience: "House wiring, distribution boards, and fault finding. I do not leave open joints. Most of my jobs are flats in Wuse and Garki. I will tell you if a job needs a certified inspection before I start."
	},
	{
		countryCode: "KE",
		regionCode: "NB",
		townName: "Nairobi",
		communityName: "Westlands",
		skillId: "tailor",
		years: 9,
		displayName: "Wanjiku Njeri",
		photo: "/samples/tailor.jpg",
		experience: "I cut and sew everyday dresses, school uniforms, and alterations from wax print and plain cloth. Fittings are in Westlands. I keep your measurements and I do not rush a guest outfit the night before."
	},
	{
		countryCode: "ZA",
		regionCode: "GP",
		townName: "Johannesburg",
		communityName: "Soweto",
		skillId: "carpenter",
		years: 17,
		displayName: "Thabo Molefe",
		photo: "/samples/carpenter.jpg",
		experience: "Tables, door frames, kitchen cabinets, and roof timber. I have worked from a Soweto workshop since I was an apprentice. I measure twice and I leave the site swept when the job is done."
	},
	{
		countryCode: "GH",
		regionCode: "GA",
		townName: "Accra",
		communityName: "Labone",
		skillId: "gardener",
		years: 12,
		displayName: "Efua Darko",
		photo: "/samples/garden.jpg",
		experience: "I keep home gardens in Labone and Cantonments: lawn edges, hedges, flower beds, and watering. I bring my own shears and I leave clippings bagged. The garden in the photo is a compound I tend every week."
	}
];
var COLUMNS = `id, user_id, country_code, country_name, region_code, region_name,
  town_code, town_name, community_code, community_name, skill_id, skill_name,
  years, display_name, phone, whatsapp, email, reach, contact_active, experience, photo,
  currency, fee_label, pay_reference, is_sample`;
function asBool(value) {
	if (typeof value === "boolean") return value;
	if (typeof value === "number") return value !== 0;
	if (typeof value === "string") return value === "t" || value === "true" || value === "1";
	return false;
}
function mapRow(row, reveal) {
	const active = asBool(row.contact_active);
	const show = reveal || active && !asBool(row.is_sample);
	return {
		id: row.id,
		countryCode: row.country_code,
		countryName: row.country_name,
		regionCode: row.region_code,
		regionName: row.region_name,
		townCode: row.town_code,
		townName: row.town_name,
		communityCode: row.community_code,
		communityName: row.community_name,
		skillId: row.skill_id,
		skillName: row.skill_name,
		years: Number(row.years),
		displayName: row.display_name,
		phone: show && row.phone ? row.phone : null,
		whatsapp: show && row.whatsapp ? row.whatsapp : null,
		email: show && row.email ? row.email : null,
		reach: show && row.reach ? row.reach : null,
		contactActive: active,
		experience: row.experience,
		photo: row.photo,
		sample: asBool(row.is_sample),
		feeLabel: row.fee_label
	};
}
var PHOTO_RE = /^data:image\/(jpeg|png|webp);base64,[a-z0-9+/=\s]+$/i;
function parseDraft(input) {
	if (input.adult !== true) throw new Error("TAP only lists adults. Confirm that you are 18 or older.");
	if (input.acceptDisclaimer !== true) throw new Error("Read the due diligence notice and confirm it before publishing.");
	const place = placeByCodes(input.countryCode, input.regionCode, input.townCode, input.communityCode);
	if (!place) throw new Error("Choose a country, region, town, and community from the lists.");
	const skill = skillById(input.skillId);
	if (!skill) throw new Error("Choose a skill from the list.");
	const years = Number(input.years);
	if (!Number.isInteger(years) || years < 0 || years > 50) throw new Error("Years of experience must be a whole number from 0 to 50.");
	const displayName = cleanName(input.displayName);
	if (!displayName) throw new Error("Enter the name clients should see. Letters, spaces, and hyphens only.");
	const method = methodById(input.countryCode, input.payMethod);
	if (!method) throw new Error("Choose a Paystack method for your country.");
	const phoneRaw = (input.phone ?? "").trim();
	const phone = phoneRaw ? normalizePhone(phoneRaw, place.country.dial) : "";
	if (phoneRaw && !phone) throw new Error(`That is not a working ${place.country.name} phone number.`);
	const emailRaw = (input.email ?? "").trim();
	const email = emailRaw ? cleanEmail(emailRaw) : null;
	if (emailRaw && !email) throw new Error("That email does not look valid.");
	const reach = cleanReach(input.reach ?? "");
	const experience = input.experience.replace(/\s+/g, " ").trim();
	if (experience.length < 40 || experience.length > 800) throw new Error("Describe your work in 40 to 800 characters.");
	if (!PHOTO_RE.test(input.photo) || input.photo.length > 38e4) throw new Error("Upload a JPG, PNG, or WEBP photo of your best work.");
	if (hasProfanity([
		displayName,
		experience,
		reach,
		email ?? ""
	].join("\n"))) throw new Error("That text is not allowed on TAP. Rewrite it without profanity or sexual content.");
	return {
		place,
		feeLabel: place.country.feeLabel,
		feeMinor: place.country.feeMinor,
		currency: place.country.currency,
		draft: {
			countryCode: place.country.code,
			regionCode: place.region.code,
			townCode: place.town.code,
			communityCode: place.community.code,
			skillId: skill.id,
			years,
			displayName,
			phone: phone || "",
			email,
			whatsapp: input.whatsappSame === true && phone ? phone : null,
			reach,
			contactActive: input.contactActive === true && Boolean(phone || email || reach),
			payMethod: method.id,
			experience,
			photo: input.photo
		}
	};
}
async function reviewWithModel(draft) {
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return;
	const content = [{
		type: "text",
		text: `You moderate TAP, a public directory of tradespeople. Reply with JSON only: {"allow":true} or {"allow":false}. Reject nudity, sexual content, gore, hate, slurs, profanity, scam pitches, and photos that are not a work sample. Allow ordinary trade descriptions and photos of tools, rooms, hair, clothing, food, vehicles, and construction.\n\nName: ${draft.displayName.slice(0, 80)}\nExperience: ${draft.experience.slice(0, 900)}`
	}, {
		type: "image_url",
		image_url: { url: draft.photo }
	}];
	for (let attempt = 0; attempt < 2; attempt += 1) try {
		const res = await fetch("https://api.x.ai/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				model: "grok-4.5",
				temperature: 0,
				max_tokens: 40,
				messages: [{
					role: "user",
					content
				}]
			}),
			signal: AbortSignal.timeout(25e3)
		});
		if (!res.ok) continue;
		const match = ((await res.json()).choices?.[0]?.message?.content ?? "").match(/\{[\s\S]*\}/);
		if (!match) continue;
		const parsed = JSON.parse(match[0]);
		if (parsed.allow === true) return;
		if (parsed.allow === false) throw new Error("We rejected this photo or description. Remove anything profane, sexual, or violent, and use a real picture of your work.");
	} catch (error) {
		if (error instanceof Error && error.message.startsWith("We rejected")) throw error;
	}
	throw new Error("We could not review this submission. Please try again in a moment.");
}
async function ensureSamples(sql) {
	for (const sample of SAMPLES) {
		const place = locateByName(sample.countryCode, sample.regionCode, sample.townName, sample.communityName);
		const skill = skillById(sample.skillId);
		if (!place || !skill) continue;
		const id = `${placeKey(place)}-0001`;
		await sql.query(`insert into listings (
        id, user_id, country_code, country_name, region_code, region_name,
        town_code, town_name, community_code, community_name, skill_id, skill_name,
        years, display_name, phone, whatsapp, email, reach, contact_active, experience,
        photo, currency, fee_label, pay_reference, is_sample
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,true
      ) on conflict (id) do update set reach = excluded.reach
        where listings.is_sample = true and listings.reach = ''`, [
			id,
			`seed:${id}`,
			place.country.code,
			place.country.name,
			place.region.code,
			place.region.name,
			place.town.code,
			place.town.name,
			place.community.code,
			place.community.name,
			skill.id,
			skill.name,
			sample.years,
			sample.displayName,
			"",
			null,
			null,
			"Sample profile. No phone or email is listed.",
			true,
			sample.experience,
			sample.photo,
			place.country.currency,
			place.country.feeLabel,
			`SAMPLE-${id}`
		]);
		await sql.query(`insert into id_counters (place_key, n) values ($1, 1)
       on conflict (place_key) do update set n = greatest(id_counters.n, 1)`, [placeKey(place)]);
	}
}
async function rowByUser(sql, userId) {
	return (await sql.query(`select ${COLUMNS} from listings where user_id = $1 and is_sample = false limit 1`, [userId]))[0] ?? null;
}
async function rowByReference(sql, reference) {
	return (await sql.query(`select ${COLUMNS} from listings where pay_reference = $1 limit 1`, [reference]))[0] ?? null;
}
async function allocateId(sql, key) {
	const rows = await sql.query(`insert into id_counters (place_key, n) values ($1, 1)
     on conflict (place_key) do update set n = id_counters.n + 1
     returning n`, [key]);
	const n = Number(rows[0]?.n ?? 1);
	return `${key}-${String(n).padStart(4, "0")}`;
}
async function insertFromDraft(sql, userId, draft, reference) {
	const place = placeByCodes(draft.countryCode, draft.regionCode, draft.townCode, draft.communityCode);
	const skill = skillById(draft.skillId);
	if (!place || !skill) throw new Error("This listing is no longer valid. Start again.");
	const existingRef = await rowByReference(sql, reference);
	if (existingRef) return mapRow(existingRef, existingRef.user_id === userId);
	const owned = await rowByUser(sql, userId);
	if (owned) return mapRow(owned, true);
	const id = await allocateId(sql, placeKey(place));
	try {
		await sql.query(`insert into listings (
        id, user_id, country_code, country_name, region_code, region_name,
        town_code, town_name, community_code, community_name, skill_id, skill_name,
        years, display_name, phone, whatsapp, email, reach, contact_active, experience,
        photo, currency, fee_label, pay_reference, is_sample
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,false
      )`, [
			id,
			userId,
			place.country.code,
			place.country.name,
			place.region.code,
			place.region.name,
			place.town.code,
			place.town.name,
			place.community.code,
			place.community.name,
			skill.id,
			skill.name,
			draft.years,
			draft.displayName,
			draft.phone,
			draft.whatsapp,
			draft.email,
			draft.reach,
			draft.contactActive,
			draft.experience,
			draft.photo,
			place.country.currency,
			place.country.feeLabel,
			reference
		]);
	} catch {
		const again = await rowByReference(sql, reference) ?? await rowByUser(sql, userId);
		if (again) return mapRow(again, again.user_id === userId);
		throw new Error("Could not publish the listing. Try again.");
	}
	const created = await rowByUser(sql, userId);
	if (!created) throw new Error("Could not publish the listing. Try again.");
	return mapRow(created, true);
}
async function updateOwned(sql, userId, draft) {
	const place = placeByCodes(draft.countryCode, draft.regionCode, draft.townCode, draft.communityCode);
	const skill = skillById(draft.skillId);
	if (!place || !skill) throw new Error("Choose a place and skill from the lists.");
	await sql.query(`update listings set
      country_code = $1, country_name = $2, region_code = $3, region_name = $4,
      town_code = $5, town_name = $6, community_code = $7, community_name = $8,
      skill_id = $9, skill_name = $10, years = $11, display_name = $12,
      phone = $13, whatsapp = $14, email = $15, reach = $16, contact_active = $17,
      experience = $18, photo = $19, currency = $20, fee_label = $21
     where user_id = $22 and is_sample = false`, [
		place.country.code,
		place.country.name,
		place.region.code,
		place.region.name,
		place.town.code,
		place.town.name,
		place.community.code,
		place.community.name,
		skill.id,
		skill.name,
		draft.years,
		draft.displayName,
		draft.phone,
		draft.whatsapp,
		draft.email,
		draft.reach,
		draft.contactActive,
		draft.experience,
		draft.photo,
		place.country.currency,
		place.country.feeLabel,
		userId
	]);
	const row = await rowByUser(sql, userId);
	if (!row) throw new Error("Could not update your listing.");
	return mapRow(row, true);
}
function paystackKey() {
	const key = process.env.PAYSTACK_SECRET_KEY?.trim();
	return key ? key : null;
}
function callbackUrl(origin) {
	let url;
	try {
		url = new URL(origin);
	} catch {
		throw new Error("Could not start payment.");
	}
	if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Could not start payment.");
	return `${url.origin}/pay/callback`;
}
function messageOf(error) {
	if (error instanceof Error && error.message) return error.message;
	return "Something went wrong. Try again.";
}
var searchListings_createServerFn_handler = createServerRpc({
	id: "3942351202a2a7d0ce027046988844624e2f0b248240cd5fcd71fb54ec38aa98",
	name: "searchListings",
	filename: "src/lib/listings-api.ts"
}, (opts) => searchListings.__executeServer(opts));
var searchListings = createServerFn({ method: "POST" }).validator((input) => input ?? {}).handler(searchListings_createServerFn_handler, async ({ data }) => {
	try {
		const sql = await getSql();
		await ensureSamples(sql);
		const where = ["true"];
		const params = [];
		const add = (column, value) => {
			const clean = (value ?? "").trim();
			if (!clean) return;
			params.push(clean);
			where.push(`${column} = $${params.length}`);
		};
		add("country_code", data.country);
		add("region_code", data.region);
		add("town_code", data.town);
		add("skill_id", data.skill);
		const q = (data.q ?? "").trim().slice(0, 80);
		if (q) {
			params.push(`%${q.replace(/[%_\\]/g, "")}%`);
			const slot = `$${params.length}`;
			where.push(`(display_name ilike ${slot} or skill_name ilike ${slot} or town_name ilike ${slot} or community_name ilike ${slot} or id ilike ${slot})`);
		}
		const clause = where.join(" and ");
		const rows = await sql.query(`select ${COLUMNS} from listings where ${clause} order by is_sample asc, id desc limit 48`, params);
		const totals = await sql.query(`select count(*)::int as n from listings where ${clause}`, params);
		return {
			ok: true,
			data: {
				listings: rows.map((row) => mapRow(row, false)),
				total: Number(totals[0]?.n ?? rows.length)
			}
		};
	} catch (error) {
		return {
			ok: false,
			error: messageOf(error)
		};
	}
});
var getListing_createServerFn_handler = createServerRpc({
	id: "92635afd1407d1a49886dea10a898018a1e099b6b58f0969242fd4ca722def31",
	name: "getListing",
	filename: "src/lib/listings-api.ts"
}, (opts) => getListing.__executeServer(opts));
var getListing = createServerFn({ method: "POST" }).validator((input) => input).handler(getListing_createServerFn_handler, async ({ data }) => {
	try {
		const id = (data.id ?? "").trim().toUpperCase();
		if (!/^[A-Z0-9]+(?:-[A-Z0-9]+){4}$/.test(id)) return {
			ok: true,
			data: null
		};
		const sql = await getSql();
		await ensureSamples(sql);
		const rows = await sql.query(`select ${COLUMNS} from listings where id = $1 limit 1`, [id]);
		return {
			ok: true,
			data: rows[0] ? mapRow(rows[0], false) : null
		};
	} catch (error) {
		return {
			ok: false,
			error: messageOf(error)
		};
	}
});
var getMine_createServerFn_handler = createServerRpc({
	id: "4278ea6c4e83b9d9f6215a7c748fb4381b1c2afca093a421682c24d9cd2fd49a",
	name: "getMine",
	filename: "src/lib/listings-api.ts"
}, (opts) => getMine.__executeServer(opts));
var getMine = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getMine_createServerFn_handler, async ({ context }) => {
	try {
		const sql = await getSql();
		await ensureSamples(sql);
		const row = await rowByUser(sql, context.userId);
		return {
			ok: true,
			data: row ? mapRow(row, true) : null
		};
	} catch (error) {
		return {
			ok: false,
			error: messageOf(error)
		};
	}
});
var submitListing_createServerFn_handler = createServerRpc({
	id: "4552ecba335283333752e0f83fc15dd04e059f21ae2b4073c152ad22c6011f4d",
	name: "submitListing",
	filename: "src/lib/listings-api.ts"
}, (opts) => submitListing.__executeServer(opts));
var submitListing = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(submitListing_createServerFn_handler, async ({ data, context }) => {
	try {
		const parsed = parseDraft(data);
		const sql = await getSql();
		await ensureSamples(sql);
		const owned = await rowByUser(sql, context.userId);
		if (!(owned && owned.photo === parsed.draft.photo && owned.experience === parsed.draft.experience && owned.display_name === parsed.draft.displayName && owned.reach === parsed.draft.reach && owned.phone === parsed.draft.phone && (owned.email ?? "") === (parsed.draft.email ?? ""))) await reviewWithModel(parsed.draft);
		if (owned) return {
			ok: true,
			data: {
				status: "published",
				listing: await updateOwned(sql, context.userId, parsed.draft),
				updated: true
			}
		};
		const reference = `TAP-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`.toUpperCase();
		await sql.query("delete from pending_listings where user_id = $1", [context.userId]);
		await sql.query("insert into pending_listings (reference, user_id, payload) values ($1, $2, $3)", [
			reference,
			context.userId,
			JSON.stringify(parsed.draft)
		]);
		const secret = paystackKey();
		const method = methodById(parsed.draft.countryCode, parsed.draft.payMethod);
		if (!method) return {
			ok: false,
			error: "Choose a Paystack method for your country."
		};
		if (!secret) return {
			ok: true,
			data: {
				status: "preview",
				reference,
				feeLabel: parsed.feeLabel,
				payMethod: method.id,
				qr: method.channel === "qr"
			}
		};
		const receipt = await sql.query(`select email from "user" where id = $1 limit 1`, [context.userId]);
		const accountEmail = cleanEmail(receipt[0]?.email ?? "");
		const email = parsed.draft.email || (accountEmail && !accountEmail.endsWith("@viewer.grok.invalid") ? accountEmail : null);
		if (!email) return {
			ok: false,
			error: "Add an email on the contact step so Paystack can send a receipt. It is public only if you leave contact on."
		};
		const res = await fetch("https://api.paystack.co/transaction/initialize", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${secret}`,
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				email,
				amount: parsed.feeMinor,
				currency: parsed.currency,
				reference,
				channels: [method.channel],
				callback_url: callbackUrl(data.origin),
				metadata: {
					user_id: context.userId,
					listing: "tap",
					pay_method: method.id
				}
			})
		});
		const body = await res.json();
		const authorizationUrl = body.data?.authorization_url;
		if (!res.ok || !body.status || !authorizationUrl) return {
			ok: false,
			error: "Paystack could not start the payment. Try again."
		};
		return {
			ok: true,
			data: {
				status: "paystack",
				authorizationUrl,
				reference,
				feeLabel: parsed.feeLabel,
				payMethod: method.id,
				qr: method.channel === "qr"
			}
		};
	} catch (error) {
		return {
			ok: false,
			error: messageOf(error)
		};
	}
});
var confirmPreview_createServerFn_handler = createServerRpc({
	id: "698ceffa6937786b7b2728973354b350d23b9bc2fe152c3c5839ddd4171d0778",
	name: "confirmPreview",
	filename: "src/lib/listings-api.ts"
}, (opts) => confirmPreview.__executeServer(opts));
var confirmPreview = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(confirmPreview_createServerFn_handler, async ({ data, context }) => {
	try {
		if (paystackKey()) return {
			ok: false,
			error: "Finish this payment on Paystack."
		};
		const reference = (data.reference ?? "").trim();
		const sql = await getSql();
		const row = (await sql.query("select payload, user_id from pending_listings where reference = $1 limit 1", [reference]))[0];
		if (!row || row.user_id !== context.userId) return {
			ok: false,
			error: "This checkout expired. Submit the listing again."
		};
		const draft = JSON.parse(row.payload);
		const listing = await insertFromDraft(sql, context.userId, draft, reference);
		await sql.query("delete from pending_listings where reference = $1", [reference]);
		return {
			ok: true,
			data: listing
		};
	} catch (error) {
		return {
			ok: false,
			error: messageOf(error)
		};
	}
});
var finalizePaystack_createServerFn_handler = createServerRpc({
	id: "4b70dea416882fb25880cd58cdd5d9abc0295b81701e3e8c420f48ce35923dcb",
	name: "finalizePaystack",
	filename: "src/lib/listings-api.ts"
}, (opts) => finalizePaystack.__executeServer(opts));
var finalizePaystack = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(finalizePaystack_createServerFn_handler, async ({ data, context }) => {
	try {
		const secret = paystackKey();
		if (!secret) return {
			ok: false,
			error: "Paystack is not connected on this preview."
		};
		const reference = (data.reference ?? "").trim();
		const sql = await getSql();
		const already = await rowByReference(sql, reference);
		if (already && already.user_id === context.userId) return {
			ok: true,
			data: mapRow(already, true)
		};
		const row = (await sql.query("select payload, user_id from pending_listings where reference = $1 limit 1", [reference]))[0];
		if (!row || row.user_id !== context.userId) return {
			ok: false,
			error: "We could not find this payment on your account."
		};
		const draft = JSON.parse(row.payload);
		const place = placeByCodes(draft.countryCode, draft.regionCode, draft.townCode, draft.communityCode);
		if (!place) return {
			ok: false,
			error: "This listing is no longer valid."
		};
		const verify = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, { headers: { Authorization: `Bearer ${secret}` } });
		const body = await verify.json();
		if (!verify.ok || body.data?.status !== "success") return {
			ok: false,
			error: "Paystack has not confirmed this payment yet."
		};
		if (Number(body.data.amount) !== place.country.feeMinor) return {
			ok: false,
			error: "The amount paid does not match the listing fee."
		};
		if (String(body.data.currency).toUpperCase() !== place.country.currency) return {
			ok: false,
			error: "The payment currency does not match your country."
		};
		const listing = await insertFromDraft(sql, context.userId, draft, reference);
		await sql.query("delete from pending_listings where reference = $1", [reference]);
		return {
			ok: true,
			data: listing
		};
	} catch (error) {
		return {
			ok: false,
			error: messageOf(error)
		};
	}
});
//#endregion
export { confirmPreview_createServerFn_handler, finalizePaystack_createServerFn_handler, getListing_createServerFn_handler, getMine_createServerFn_handler, searchListings_createServerFn_handler, submitListing_createServerFn_handler };
