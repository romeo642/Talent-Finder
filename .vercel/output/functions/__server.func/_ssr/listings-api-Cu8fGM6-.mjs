import { a as getServerFnById, i as TSS_SERVER_FUNCTION, r as createServerFn } from "./ssr.mjs";
import { t as authMiddleware } from "./middleware-B2TkA9Mi.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/listings-api-Cu8fGM6-.js
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var searchListings = createServerFn({ method: "POST" }).validator((input) => input ?? {}).handler(createSsrRpc("3942351202a2a7d0ce027046988844624e2f0b248240cd5fcd71fb54ec38aa98"));
var getListing = createServerFn({ method: "POST" }).validator((input) => input).handler(createSsrRpc("92635afd1407d1a49886dea10a898018a1e099b6b58f0969242fd4ca722def31"));
var getMine = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("4278ea6c4e83b9d9f6215a7c748fb4381b1c2afca093a421682c24d9cd2fd49a"));
var submitListing = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("4552ecba335283333752e0f83fc15dd04e059f21ae2b4073c152ad22c6011f4d"));
var confirmPreview = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("698ceffa6937786b7b2728973354b350d23b9bc2fe152c3c5839ddd4171d0778"));
var finalizePaystack = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("4b70dea416882fb25880cd58cdd5d9abc0295b81701e3e8c420f48ce35923dcb"));
//#endregion
export { searchListings as a, getMine as i, finalizePaystack as n, submitListing as o, getListing as r, confirmPreview as t };
