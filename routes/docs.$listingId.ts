import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { DOC_BYTES_MAX } from "@/lib/media";

const ID_RE = /^[A-Z0-9]+(?:-[A-Z0-9]+){4}$/;

function bytesOf(body: string): ArrayBuffer {
  const binary = atob(body);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return buffer;
}

export const Route = createFileRoute("/docs/$listingId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const id = String(params.listingId ?? "").trim().toUpperCase();
        if (!ID_RE.test(id)) return new Response(null, { status: 404 });
        try {
          const sql = await getSql();
          const rows = await sql.query<{ mime: string; body: string; name: string }>(
            "select mime, body, name from listing_documents where listing_id = $1 limit 1",
            [id],
          );
          const row = rows[0];
          if (!row || row.body.length > DOC_BYTES_MAX * 2) return new Response(null, { status: 404 });
          const bytes = bytesOf(row.body);
          const safeName = row.name.replace(/[^\w.\- ]+/g, "") || "work-document";
          return new Response(bytes, {
            headers: {
              "Content-Type": row.mime === "application/pdf" ? "application/pdf" : row.mime,
              "Content-Length": String(bytes.byteLength),
              "Content-Disposition": `inline; filename="${safeName}"`,
              "X-Content-Type-Options": "nosniff",
              "Cache-Control": "private, max-age=3600",
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
