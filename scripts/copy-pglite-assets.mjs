/**
 * Nitro's Vercel preset bundles @electric-sql/pglite into one file, but the
 * runtime still loads ./pglite.data, ./pglite.wasm and ./initdb.wasm beside it.
 * Copy those siblings into the function output so preview (no DATABASE_URL)
 * can open the embedded database. Deployed apps use Neon and never touch them.
 */
import { copyFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = join(root, "node_modules/@electric-sql/pglite/dist");
const destDir = join(root, ".vercel/output/functions/__server.func/_libs");

if (!existsSync(destDir)) {
  console.log("[pglite] no function bundle — skip asset copy");
  process.exit(0);
}

for (const name of ["pglite.data", "pglite.wasm", "initdb.wasm"]) {
  copyFileSync(join(srcDir, name), join(destDir, name));
}
console.log("[pglite] copied data and wasm next to the bundled runtime");
