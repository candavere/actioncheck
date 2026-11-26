import { test } from "node:test";
import assert from "node:assert/strict";
import { extractExpressions, parseExpression } from "../src/expr.js";

test("extracts expressions, honouring quotes containing }}", () => {
  const r = extractExpressions("a ${{ 'x }} y' }} b ${{ github.sha }}");
  assert.deepEqual(r.expressions.map((e) => e.inner.trim()), ["'x }} y'", "github.sha"]);
  assert.equal(r.errors.length, 0);
});
test("unclosed ${{ is an error", () => {
  const r = extractExpressions("echo ${{ inputs.a");
  assert.equal(r.errors.length, 1);
});
const valid = [
  "github.event.pull_request.labels.*.name", "!cancelled()", "a == 'b' && (c || d)",
  "format('{0}', inputs.x)", "steps.my-step.outputs.value", "inputs['dash-name']", "-1.5e2 < 0x10",
  "toJSON(github)", "true", "null", "matrix.os != 'windows-latest'", "fromJSON('[1,2]')[0]",
];
for (const v of valid) test(`parses: ${v}`, () => assert.equal(parseExpression(v).errors.length, 0, JSON.stringify(parseExpression(v).errors)));
const invalid = ["", "a ==", "(a", "fromJSON('x'", "a.", "'unterminated", "a ||| b", "a b"];
for (const v of invalid) test(`rejects: ${JSON.stringify(v)}`, () => assert.ok(parseExpression(v).errors.length > 0));

test("collects context references and functions", () => {
  const r = parseExpression("contains(steps.a.outputs.x, inputs['B']) || secrets.T");
  assert.deepEqual(r.refs.map((x) => [x.root, x.path[0]]), [["steps", "a"], ["inputs", "B"], ["secrets", "T"]]);
  assert.deepEqual(r.calls.map((c) => c.name), ["contains"]);
});
test("fuzz: random strings never throw", () => {
  const alphabet = "abc._-*()[]'!=<>&|, 0123456789${}";
  let seed = 42;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed; };
  for (let i = 0; i < 5000; i++) {
    let s = ""; const n = rnd() % 30;
    for (let j = 0; j < n; j++) s += alphabet[rnd() % alphabet.length];
    parseExpression(s); extractExpressions(s);
  }
});
