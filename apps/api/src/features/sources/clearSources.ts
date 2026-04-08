import db from "../../db";
import { sources } from "../../db/schema";
import ensureBuiltinSources from "./ensureBuiltinSources";

export async function clearSources() {
  await db.delete(sources);

  // reseed builtinsources after debug clear
  await ensureBuiltinSources();
}
