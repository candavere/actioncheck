import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createRequire } from "node:module";
import { lintSource } from "../src/lint.js";
import { toSarif, toGithub, toText } from "../src/format.js";

const require = createRequire(import.meta.url);
const Ajv = require("ajv");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const schema = JSON.parse(readFileSync(path.join(root, "test", "schemas", "sarif-2.1.0.json"), "utf8"));
const all = ["ac002/bad", "ac003/bad", "ac004/bad", "ac006/bad", "ac007/bad", "ac002/good"].flatMap((p) => {
  const f = path.join(root, "test", "fixtures", p, "action.yml");
  return lintSource(readFileSync(f, "utf8"), path.relative(root, f)).diagnostics;
});

test("SARIF output validates against the SARIF 2.1.0 schema", () => {
  const ajv = new Ajv({ strict: false, allErrors: true, validateFormats: false });
  const validate = ajv.compile(schema);
  for (const diags of [all, []]) {
    const doc = toSarif(diags, "0.0.0-test");
    const ok = validate(doc);
    assert.ok(ok, JSON.stringify(validate.errors, null, 1));
  }
  const doc = toSarif(all, "0.0.0-test");
  assert.equal(doc.runs[0].results.length, all.length);
  assert.ok(doc.runs[0].results.every((r: any) => !r.locations[0].physicalLocation.artifactLocation.uri.includes("\\")));
});

test("GitHub annotations: one line per finding, properties escaped", () => {
  const out = toGithub([{ ruleId: "AC002", level: "error", message: "a, b: 50%\nnext", file: "x,y:z.yml", line: 3, column: 5 }]);
  assert.equal(out, "::error file=x%2Cy%3Az.yml,line=3,col=5,title=AC002::a, b: 50%25%0Anext\n");
  const w = toGithub([{ ruleId: "AC007", level: "warning", message: "m", file: "a.yml", line: 1, column: 1 }]);
  assert.match(w, /^::warning /);
});

test("text output format", () => {
  const out = toText([{ ruleId: "AC003", level: "error", message: "msg", file: "a/action.yml", line: 2, column: 9 }]);
  assert.equal(out, "a/action.yml:2:9: error: msg [AC003]\n");
});
