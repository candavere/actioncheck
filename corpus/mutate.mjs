// Mutation check: inject one known bug per rule into each corpus file and count how many actioncheck detects.
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { lintSource } from "../dist/src/lint.js";
const dir = path.join(path.dirname(new URL(import.meta.url).pathname), "actions");
const muts = {
  AC002: (s) => s.replace(/^(\s+)shell:\s*\S+\s*\n/m, ""),                      // drop first shell:
  AC003: (s) => s.replace(/inputs\.([A-Za-z_][\w-]*)/, "inputs.$1_typo"),        // misspell first input ref
  AC004: (s) => s.replace(/steps\.([A-Za-z_][\w-]*)\./, "steps.$1_typo."),        // misspell first step ref
  AC006: (s) => s.replace(/\$\{\{\s*([a-z])/, "${{ secrets.X || $1"),             // add secrets to first expression
  AC007: (s) => s.replace(/^(\s*-?\s*uses:\s*)(?!\.\/|docker:)([^\s@#]+)@\S+/m, "$1$2"), // drop the ref of first remote uses
};
const rows = []; const tot = {};
for (const d of readdirSync(dir)) {
  const f = readdirSync(path.join(dir, d)).find((n) => n.startsWith("action."));
  const src = readFileSync(path.join(dir, d, f), "utf8");
  const base = lintSource(src, f).diagnostics.filter((x) => x.level === "error").length;
  for (const [rule, m] of Object.entries(muts)) {
    const mut = m(src);
    tot[rule] ??= { applied: 0, detected: 0 };
    if (mut === src) continue;
    tot[rule].applied++;
    const errs = lintSource(mut, f).diagnostics.filter((x) => x.level === "error" && x.ruleId === rule);
    if (errs.length > 0) tot[rule].detected++; else rows.push(`MISSED ${rule} in ${d}`);
  }
}
console.log(rows.join("\n")); console.log(JSON.stringify(tot));
