import { useEffect, useState } from "react";

export function QrMark({ text, caption }: { text: string; caption: string }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    let cancel = false;
    void import("qrcode")
      .then((mod) => {
        const qr = mod as { toDataURL?: (value: string, options?: object) => Promise<string>; default?: { toDataURL: (value: string, options?: object) => Promise<string> } };
        const toDataURL = qr.toDataURL ?? qr.default?.toDataURL;
        if (!toDataURL) throw new Error("QR unavailable");
        return toDataURL(text, {
          margin: 1,
          width: 280,
          errorCorrectionLevel: "M",
          color: { dark: "#1c3f4a", light: "#fbf6ee" },
        });
      })
      .then((url) => {
        if (!cancel) setSrc(url);
      })
      .catch(() => {
        if (!cancel) setSrc("");
      });
    return () => {
      cancel = true;
    };
  }, [text]);

  return (
    <figure className="w-fit rounded-control border border-line bg-paper p-3">
      {src ? (
        <img src={src} alt="" width={176} height={176} className="size-44" />
      ) : (
        <div className="size-44 animate-pulse rounded-control bg-line" />
      )}
      <figcaption className="mt-2 max-w-44 text-center text-xs leading-relaxed text-muted">{caption}</figcaption>
    </figure>
  );
}
