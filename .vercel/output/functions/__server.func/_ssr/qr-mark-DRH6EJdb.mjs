import { o as __toESM } from "../_runtime.mjs";
import { C as require_jsx_runtime, X as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/qr-mark-DRH6EJdb.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function QrMark({ text, caption }) {
	const [src, setSrc] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		let cancel = false;
		import("../_libs/qrcode.mjs").then((n) => /* @__PURE__ */ __toESM(n.t())).then((mod) => {
			const qr = mod;
			const toDataURL = qr.toDataURL ?? qr.default?.toDataURL;
			if (!toDataURL) throw new Error("QR unavailable");
			return toDataURL(text, {
				margin: 1,
				width: 280,
				errorCorrectionLevel: "M",
				color: {
					dark: "#1c3f4a",
					light: "#fbf6ee"
				}
			});
		}).then((url) => {
			if (!cancel) setSrc(url);
		}).catch(() => {
			if (!cancel) setSrc("");
		});
		return () => {
			cancel = true;
		};
	}, [text]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", {
		className: "w-fit rounded-control border border-line bg-paper p-3",
		children: [src ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src,
			alt: "",
			width: 176,
			height: 176,
			className: "size-44"
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "size-44 animate-pulse rounded-control bg-line" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("figcaption", {
			className: "mt-2 max-w-44 text-center text-xs leading-relaxed text-muted",
			children: caption
		})]
	});
}
//#endregion
export { QrMark as t };
