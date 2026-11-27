import { parseDocument, isMap, isSeq, isScalar, isPair, LineCounter } from "yaml";
import type { Node, Pair, YAMLMap, Scalar } from "yaml";
import { extractExpressions, parseExpression } from "./expr.js";

export type Level = "error" | "warning";
export interface Diagnostic {
  ruleId: string;
  level: Level;
  message: string;
  file: string;
  line: number;
  column: number;
}
export interface LintResult { file: string; diagnostics: Diagnostic[]; skipped: boolean }

export interface RuleInfo { id: string; name: string; description: string }
export const RULES: RuleInfo[] = [
  { id: "AC000", name: "yaml-syntax", description: "The file is not valid YAML." },
  { id: "AC002", name: "run-needs-shell", description: "In a composite action every `run` step must set `shell`." },
  { id: "AC003", name: "inputs", description: "`inputs.<name>` must be declared under `inputs:`; declared inputs that are never used are reported as warnings." },
  { id: "AC004", name: "step-ids", description: "`steps.<id>` must refer to a step defined earlier; step ids must be unique; output values must point at existing steps." },
  { id: "AC006", name: "expressions", description: "Expressions must parse, call known functions and use contexts that exist in composite actions (no `secrets`, `needs` or `vars`)." },
  { id: "AC007", name: "uses-ref", description: "`uses:` must be `owner/repo[/path]@ref`, `./local`, or `docker://image`; refs not pinned to a full commit SHA are warnings." },
];

// Contexts usable inside composite action steps.
// `secrets`: unavailable. The docs say "The secrets context is not available for composite actions":
//   https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#secrets-context
// `needs` and `vars`: unavailable in `run:` expressions. Verified on GitHub's runner in run 46002009819:
//   "Unrecognized named-value: 'needs'" and "Unrecognized named-value: 'vars'", summary
//   "needs=failure vars=failure matrix=success steps=success all=failure" (evidence/probe.log).
//   Scope is run: expressions only; if:/env:/with: were not probed.
const ALLOWED_CONTEXTS = new Set(["github", "env", "inputs", "steps", "runner", "job", "strategy", "matrix"]);
const KNOWN_FUNCTIONS = new Set([
  "contains", "startswith", "endswith", "format", "join", "tojson", "fromjson", "hashfiles",
  "success", "always", "cancelled", "failure",
]);
const SHA_RE = /^[0-9a-f]{40}$/;
const REMOTE_USES_RE = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(\/[^@\s]+)?@[^@\s]+$/;

export interface LintOptions {
  /** Report declared inputs that are never read (AC003 warning). Default: true. */
  unusedInputs?: boolean;
}

export function lintSource(source: string, file: string, options: LintOptions = {}): LintResult {
  const unusedInputs = options.unusedInputs ?? true;
  const lc = new LineCounter();
  const diagnostics: Diagnostic[] = [];
  const at = (offset: number) => { const p = lc.linePos(Math.max(0, offset)); return { line: p.line, column: p.col }; };
  const report = (ruleId: string, level: Level, message: string, offset: number) =>
    diagnostics.push({ ruleId, level, message, file, ...at(offset) });

  const doc = parseDocument(source, { lineCounter: lc, prettyErrors: false, uniqueKeys: false });
  if (doc.errors.length > 0) {
    for (const e of doc.errors) report("AC000", "error", `YAML syntax error: ${e.message.split("\n")[0]}`, e.pos[0]);
    return { file, diagnostics, skipped: false };
  }
  const root = doc.contents;
  if (!isMap(root)) return { file, diagnostics, skipped: true };
  const runs = get(root, "runs");
  const using = isMap(runs) ? get(runs, "using") : undefined;
  if (!isScalar(using) || String(using.value).toLowerCase() !== "composite") return { file, diagnostics, skipped: true };

  // Declared inputs (names are case-insensitive).
  const declared = new Map<string, Pair>();
  const inputsNode = get(root, "inputs");
  if (isMap(inputsNode)) for (const p of inputsNode.items) if (isScalar(p.key)) declared.set(String(p.key.value).toLowerCase(), p);
  const usedInputs = new Set<string>();
  let wholeInputsUsed = false;

  // Step ids in order.
  const stepsNode = isMap(runs) ? get(runs, "steps") : undefined;
  const steps = isSeq(stepsNode) ? stepsNode.items : [];
  const idIndex = new Map<string, number>();
  steps.forEach((s, i) => {
    if (!isMap(s)) return;
    const id = get(s, "id");
    if (!isScalar(id) || id.value == null) return;
    const key = String(id.value).toLowerCase();
    if (idIndex.has(key)) report("AC004", "error", `duplicate step id "${id.value}" (first defined in step ${idIndex.get(key)! + 1})`, id.range?.[0] ?? 0);
    else idIndex.set(key, i);
  });

  // stepIndex = index of the step being checked, or -1 for action outputs (any step may be referenced).
  function checkString(node: Scalar, stepIndex: number, bare: boolean) {
    const value = node.value;
    if (typeof value !== "string") return;
    const startOffset = node.range?.[0] ?? 0;
    const endOffset = node.range?.[1] ?? startOffset;
    const ex = extractExpressions(value);
    const pieces: { inner: string; srcOffset: number }[] = [];
    let cursor = startOffset;
    for (const e of ex.expressions) {
      const raw = value.slice(e.start, e.end);
      const found = source.indexOf(raw, cursor);
      const srcStart = found >= 0 && found <= endOffset ? found : startOffset;
      if (found >= 0 && found <= endOffset) cursor = found + raw.length;
      pieces.push({ inner: e.inner, srcOffset: srcStart + 3 });
    }
    for (const err of ex.errors) {
      const raw = value.slice(err.offset, err.offset + 3);
      const found = source.indexOf(raw, cursor);
      report("AC006", "error", err.message, found >= 0 && found <= endOffset ? found : startOffset);
    }
    if (bare && ex.expressions.length === 0 && ex.errors.length === 0 && value.trim() !== "") {
      // `if:` without ${{ }} is itself an expression.
      const found = source.indexOf(value, startOffset);
      pieces.push({ inner: value, srcOffset: found >= 0 && found <= endOffset ? found : startOffset });
    }
    for (const p of pieces) checkExpression(p.inner, p.srcOffset, stepIndex);
  }

  function checkExpression(inner: string, srcOffset: number, stepIndex: number) {
    const r = parseExpression(inner);
    for (const e of r.errors) report("AC006", "error", `invalid expression: ${e.message}`, srcOffset + e.offset);
    for (const c of r.calls) {
      if (!KNOWN_FUNCTIONS.has(c.name.toLowerCase())) report("AC006", "error", `unknown function "${c.name}"`, srcOffset + c.offset);
    }
    for (const ref of r.refs) {
      const rootName = ref.root.toLowerCase();
      const off = srcOffset + ref.offset;
      if (rootName === "secrets") {
        report("AC006", "error", "the \"secrets\" context is not available in composite actions; pass the secret in as an input", off);
        continue;
      }
      // Confirmed by run 46002009819 for run: expressions (see evidence/probe.log).
      if (rootName === "needs") {
        report("AC006", "error", "the \"needs\" context is not available in composite actions; pass the value in as an input", off);
        continue;
      }
      // Confirmed by run 46002009819 for run: expressions (see evidence/probe.log).
      if (rootName === "vars") {
        report("AC006", "error", "the \"vars\" context is not available in composite actions; pass the value in as an input", off);
        continue;
      }
      if (!ALLOWED_CONTEXTS.has(rootName)) {
        report("AC006", "error", `unknown context "${ref.root}" (composite actions can use: ${[...ALLOWED_CONTEXTS].join(", ")})`, off);
        continue;
      }
      const first = ref.path[0];
      if (rootName === "inputs") {
        if (first == null) { wholeInputsUsed = true; continue; }
        const key = first.toLowerCase();
        usedInputs.add(key);
        if (!declared.has(key)) {
          const names = [...declared.values()].map((p) => String((p.key as Scalar).value));
          report("AC003", "error", `input "${first}" is not declared in this action's inputs${names.length ? ` (declared: ${names.join(", ")})` : " (no inputs are declared)"}`, off);
        }
      } else if (rootName === "steps") {
        if (first == null) continue;
        const idx = idIndex.get(first.toLowerCase());
        if (idx === undefined) report("AC004", "error", `step id "${first}" is not defined in this action`, off);
        else if (stepIndex >= 0 && idx >= stepIndex) {
          report("AC004", "error", idx === stepIndex
            ? `step "${first}" refers to its own outputs, which do not exist yet`
            : `step id "${first}" is defined in a later step (step ${idx + 1}); it has no outputs yet`, off);
        }
      }
    }
  }

  function walk(node: unknown, stepIndex: number, bare: boolean) {
    if (isScalar(node)) checkString(node, stepIndex, bare);
    else if (isMap(node)) for (const p of node.items) walk(p.value, stepIndex, false);
    else if (isSeq(node)) for (const n of node.items) walk(n, stepIndex, false);
  }

  // Action outputs.
  const outputs = get(root, "outputs");
  if (isMap(outputs)) for (const p of outputs.items) if (isMap(p.value)) {
    const v = get(p.value, "value");
    if (isScalar(v)) checkString(v, -1, false);
  }

  steps.forEach((s, i) => {
    if (!isMap(s)) return;
    const runPair = getPair(s, "run");
    if (runPair && !getPair(s, "shell")) {
      report("AC002", "error", "\"run\" step has no \"shell\"; composite actions require one (for example \"shell: bash\")", (runPair.key as Node).range?.[0] ?? 0);
    }
    for (const p of s.items) {
      if (!isScalar(p.key)) continue;
      const k = String(p.key.value).toLowerCase();
      if (k === "uses") { if (isScalar(p.value)) checkUses(p.value); continue; }
      if (k === "id") continue;
      walk(p.value, i, k === "if");
    }
  });

  function checkUses(node: Scalar) {
    const v = String(node.value ?? "").trim();
    const off = node.range?.[0] ?? 0;
    if (v.startsWith("./") || v.startsWith("../")) return;
    if (v.startsWith("docker://")) { if (v.length <= "docker://".length) report("AC007", "error", "\"uses: docker://\" needs an image name", off); return; }
    if (!REMOTE_USES_RE.test(v)) {
      report("AC007", "error", v.includes("@")
        ? `"uses: ${v}" is malformed; expected "owner/repo[/path]@ref", "./path" or "docker://image"`
        : `"uses: ${v}" has no ref; add "@<commit-sha>" (or a tag)`, off);
      return;
    }
    const ref = v.slice(v.lastIndexOf("@") + 1);
    if (!SHA_RE.test(ref)) report("AC007", "warning", `"uses: ${v}" is not pinned to a full commit SHA`, off);
  }

  if (unusedInputs && !wholeInputsUsed) for (const [key, p] of declared) {
    // Deprecated inputs are often kept on purpose for backwards compatibility.
    if (isMap(p.value) && getPair(p.value, "deprecationmessage")) continue;
    if (!usedInputs.has(key)) report("AC003", "warning", `input "${String((p.key as Scalar).value)}" is declared but never used in this action`, (p.key as Node).range?.[0] ?? 0);
  }

  diagnostics.sort((a, b) => a.line - b.line || a.column - b.column);
  return { file, diagnostics, skipped: false };
}

function getPair(map: YAMLMap, key: string): Pair | undefined {
  return map.items.find((p) => isPair(p) && isScalar(p.key) && String(p.key.value).toLowerCase() === key) as Pair | undefined;
}
function get(map: YAMLMap, key: string): unknown {
  return getPair(map, key)?.value;
}
