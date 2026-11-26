import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { lintSource } from "../src/lint.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const fx = (p: string) => path.join(root, "test", "fixtures", p, "action.yml");
function run(p: string) {
  const file = fx(p);
  return lintSource(readFileSync(file, "utf8"), file);
}
type Exp = [rule: string, level: string, line: number];
function expectDiags(p: string, exp: Exp[]) {
  const r = run(p);
  const got = r.diagnostics.map((d) => [d.ruleId, d.level, d.line] as Exp)
    .sort((a, b) => a[2] - b[2] || a[0].localeCompare(b[0]));
  const want = [...exp].sort((a, b) => a[2] - b[2] || a[0].localeCompare(b[0]));
  assert.deepEqual(got, want, JSON.stringify(r.diagnostics, null, 1));
}

test("AC002 bad: run steps without shell", () => {
  expectDiags("ac002/bad", [["AC002", "error", 6], ["AC002", "error", 8]]);
});
test("AC002 good", () => expectDiags("ac002/good", []));

test("AC003 bad: undeclared and unused inputs", () => {
  expectDiags("ac003/bad", [["AC003", "warning", 6], ["AC003", "error", 12], ["AC003", "error", 13]]);
  const d = run("ac003/bad").diagnostics.find((x) => x.line === 12)!;
  assert.equal(d.column, 42);
  assert.match(d.message, /tokn/);
});
test("AC003 good: case-insensitive, bracket access", () => expectDiags("ac003/good", []));

test("AC004 bad: missing, later and duplicate step ids", () => {
  expectDiags("ac004/bad", [["AC004", "error", 6], ["AC004", "error", 12], ["AC004", "error", 13]]);
});
test("AC004 good", () => expectDiags("ac004/good", []));

test("AC006 bad: secrets, needs, vars, typo context, syntax, unknown function", () => {
  expectDiags("ac006/bad", [
    ["AC006", "error", 7], ["AC006", "error", 9], ["AC006", "error", 9], ["AC006", "error", 9],
    ["AC006", "error", 11], ["AC006", "error", 13], ["AC006", "error", 13],
  ]);
  const msgs = run("ac006/bad").diagnostics.map((d) => d.message).join("\n");
  assert.match(msgs, /secrets/);
  assert.match(msgs, /needs/);
  assert.match(msgs, /vars/);
  assert.match(msgs, /githbu/);
  assert.match(msgs, /contans/);
});
test("AC006 good: functions, filters, strings containing }}", () => expectDiags("ac006/good", []));

test("AC007 bad: malformed and unpinned uses", () => {
  expectDiags("ac007/bad", [["AC007", "error", 6], ["AC007", "warning", 7], ["AC007", "error", 8], ["AC007", "warning", 9]]);
});
test("AC007 good: SHA, local, docker", () => expectDiags("ac007/good", []));

test("non-composite actions are skipped", () => {
  const r = run("misc/node");
  assert.equal(r.skipped, true);
  assert.equal(r.diagnostics.length, 0);
});
test("YAML errors are reported, not thrown", () => {
  const r = run("misc/yamlerr");
  assert.equal(r.diagnostics.length >= 1, true);
  assert.equal(r.diagnostics[0].ruleId, "AC000");
});
