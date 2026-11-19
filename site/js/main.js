/** Starts the page. The Supabase library loads only when this module loads. */

import { MESSAGES } from "./config.js";
import { fillLists, loadSchemaText, say, wireShareLinks } from "./ui.js";

fillLists();
wireShareLinks();
loadSchemaText();

try {
  const { bind } = await import("./actions.js");
  bind();
} catch (ignore) {
  say(MESSAGES.libraryMissing);
}
