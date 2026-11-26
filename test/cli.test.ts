import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const cli = path.join(root, "dist", "src", "cli.js");
const run = (args: string[], cwd = root) => spawnSync(process.execPath, [cli, ...args], { cwd, encoding: "utf8" });

test("exit 0 on clean action", () => {
  const r = run(["test/fixtures/clean"]);
  assert.equal(r.status, 0, r.stdout + r.stderr);
});
test("exit 1 when errors are found, findings on stdout", () => {
  const r = run(["test/fixtures/ac002/bad/action.yml"]);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /AC002/);
});
test("warnings alone exit 0", () => {
  const r = run(["test/fixtures/ac007/bad/action.yml", "--format", "text"]);
  assert.equal(r.status, 1); // has errors too
  const w = run(["test/fixtures/misc/warnonly"]);
  assert.equal(w.status, 0);
  assert.match(w.stdout, /warning: .*AC007/);
});
test("exit 2 on bad usage", () => {
  assert.equal(run(["--format", "xml"]).status, 2);
  assert.equal(run(["does/not/exist.yml"]).status, 2);
});
test("--format sarif emits JSON", () => {
  const r = run(["test/fixtures/ac004/bad", "--format", "sarif"]);
  const doc = JSON.parse(r.stdout);
  assert.equal(doc.version, "2.1.0");
});
test("directory walk finds nested action.yml and skips non-composite", () => {
  const r = run(["test/fixtures/misc/node", "test/fixtures/ac004"]);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /skipped 1 non-composite/);
});
test("--version and --help", () => {
  assert.match(run(["--version"]).stdout, /^\d+\.\d+\.\d+/);
  assert.match(run(["--help"]).stdout, /Usage: actioncheck/);
});
