import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";

const ID_RE = /^[A-Z0-9]+(?:-[A-Z0-9]+){4}$/;
const MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

function bytesOf(body: string): ArrayBuffer {
  const binary = atob(body);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return buffer;
}

export const Route = createFileRoute("/photos/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const id = String(params.id ?? "").trim().toUpperCase();
        if (!ID_RE.test(id)) return new Response(null, { status: 404 });
        try {
          const sql = await getSql();
          const rows = await sql.query<{ mime: string; body: string }>(
            "select mime, body from listing_photos where listing_id = $1 limit 1",
            [id],
          );
          const row = rows[0];
          if (!row || !MIME.has(row.mime) || row.body.length > 280_000) {
            return new Response(null, { status: 404 });
          }
          const bytes = bytesOf(row.body);
          return new Response(bytes, {
            headers: {
              "Content-Type": row.mime,
              "Content-Length": String(bytes.byteLength),
              "X-Content-Type-Options": "nosniff",
              "Cache-Control": "public, max-age=86400",
              "Content-Security-Policy": "default-src 'none'; sandbox",
            },
          });
        } catch {
          return new Response(null, { status: 404 });
        }
      },
    },
  },
});
