#!/usr/bin/env node
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";
import { lintSource, type Diagnostic } from "./lint.js";
import { toGithub, toSarif, toText } from "./format.js";

const HELP = `Usage: actioncheck [options] [paths...]

Lint the steps of composite GitHub Actions (action.yml / action.yaml).
No workflow needed. Paths may be files or directories (searched recursively).
With no paths: ./action.yml, ./action.yaml and everything under .github/actions/.

Options:
  -f, --format <text|sarif|github>  output format (default: text)
      --no-unused-inputs            do not warn about declared inputs that are never read
  -h, --help                        show this help
  -v, --version                     show version

Exit codes: 0 no errors, 1 errors found, 2 usage or file error.
`;

const SKIP_DIRS = new Set(["node_modules", ".git"]);
const isActionFile = (n: string) => n === "action.yml" || n === "action.yaml";

function walk(dir: string, out: string[]) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(p, out); }
    else if (e.isFile() && isActionFile(e.name)) out.push(p);
  }
}

function version(): string {
  const pkg = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "package.json");
  return JSON.parse(readFileSync(pkg, "utf8")).version;
}

function main(argv: string[]): number {
  let args;
  try {
    args = parseArgs({
      args: argv, allowPositionals: true, strict: true,
      options: {
        format: { type: "string", short: "f", default: "text" },
        "no-unused-inputs": { type: "boolean" },
        help: { type: "boolean", short: "h" },
        version: { type: "boolean", short: "v" },
      },
    });
  } catch (e) {
    process.stderr.write(`actioncheck: ${(e as Error).message}\n\n${HELP}`);
    return 2;
  }
  if (args.values.help) { process.stdout.write(HELP); return 0; }
  if (args.values.version) { process.stdout.write(version() + "\n"); return 0; }
  const format = args.values.format!;
  if (!["text", "sarif", "github"].includes(format)) {
    process.stderr.write(`actioncheck: unknown format "${format}" (use text, sarif or github)\n`);
    return 2;
  }

  const files: string[] = [];
  if (args.positionals.length === 0) {
    for (const f of ["action.yml", "action.yaml"]) if (existsSync(f)) files.push(f);
    if (existsSync(path.join(".github", "actions"))) walk(path.join(".github", "actions"), files);
  } else {
    for (const p of args.positionals) {
      let st;
      try { st = statSync(p); } catch {
        process.stderr.write(`actioncheck: no such file or directory: ${p}\n`);
        return 2;
      }
      if (st.isDirectory()) walk(p, files); else files.push(p);
    }
  }

  const diags: Diagnostic[] = [];
  let skipped = 0;
  for (const f of [...new Set(files)].sort()) {
    const rel = path.relative(process.cwd(), f).split(path.sep).join("/") || f;
    const r = lintSource(readFileSync(f, "utf8"), rel, { unusedInputs: !args.values["no-unused-inputs"] });
    if (r.skipped) skipped++;
    diags.push(...r.diagnostics);
  }

  if (format === "sarif") process.stdout.write(JSON.stringify(toSarif(diags, version()), null, 2) + "\n");
  else if (format === "github") process.stdout.write(toGithub(diags));
  else process.stdout.write(toText(diags));

  const errors = diags.filter((d) => d.level === "error").length;
  const warnings = diags.length - errors;
  const linted = new Set(files).size - skipped;
  process.stderr.write(
    files.length === 0
      ? "actioncheck: no action.yml files found\n"
      : `actioncheck: ${linted} composite action(s) checked, ${errors} error(s), ${warnings} warning(s)` +
        (skipped ? `, skipped ${skipped} non-composite action(s)` : "") + "\n",
  );
  return errors > 0 ? 1 : 0;
}

process.exitCode = main(process.argv.slice(2));
