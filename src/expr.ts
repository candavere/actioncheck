// Parser for GitHub Actions expressions (the part inside ${{ }}).
// Grammar follows https://docs.github.com/en/actions/reference/workflows-and-actions/expressions

export interface ExprError { message: string; offset: number }
export interface ContextRef {
  root: string;            // as written, e.g. "inputs"
  path: (string | null)[]; // property names; null = dynamic index or '*'
  offset: number;          // offset of the root identifier inside the expression text
}
export interface Call { name: string; offset: number }
export interface ParseResult { refs: ContextRef[]; calls: Call[]; errors: ExprError[] }

export interface Extracted { inner: string; start: number; end: number } // start = index of "${{", end = index after "}}"
export interface ExtractResult { expressions: Extracted[]; errors: ExprError[] }

type TokKind = "str" | "num" | "ident" | "punct" | "eof";
interface Tok { kind: TokKind; value: string; offset: number }

const PUNCT = ["&&", "||", "==", "!=", "<=", ">=", "<", ">", "!", "(", ")", "[", "]", ".", ",", "*"];
const NUM_RE = /^-?(?:0x[0-9a-fA-F]+|0o[0-7]+|(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)/;
const IDENT_RE = /^[A-Za-z_][A-Za-z0-9_-]*/;

class ParseError extends Error {
  constructor(message: string, public offset: number) { super(message); }
}

function tokenize(src: string): Tok[] {
  const toks: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === " " || c === "\t" || c === "\n" || c === "\r") { i++; continue; }
    if (c === "'") {
      let j = i + 1; let val = "";
      for (;;) {
        if (j >= src.length) throw new ParseError("unterminated string literal", i);
        if (src[j] === "'") {
          if (src[j + 1] === "'") { val += "'"; j += 2; continue; }
          break;
        }
        val += src[j++];
      }
      toks.push({ kind: "str", value: val, offset: i });
      i = j + 1; continue;
    }
    const rest = src.slice(i);
    const prev = toks[toks.length - 1];
    const numAllowed = !(prev && (prev.kind === "ident" || prev.kind === "num" || prev.kind === "str" || prev.value === ")" || prev.value === "]"));
    const num = NUM_RE.exec(rest);
    if (num && (num[0][0] !== "-" || numAllowed) && /[0-9.]/.test(num[0].replace(/^-/, "")[0] ?? "")) {
      toks.push({ kind: "num", value: num[0], offset: i }); i += num[0].length; continue;
    }
    const id = IDENT_RE.exec(rest);
    if (id) { toks.push({ kind: "ident", value: id[0], offset: i }); i += id[0].length; continue; }
    const p = PUNCT.find((x) => rest.startsWith(x));
    if (p) { toks.push({ kind: "punct", value: p, offset: i }); i += p.length; continue; }
    throw new ParseError(`unexpected character ${JSON.stringify(c)}`, i);
  }
  toks.push({ kind: "eof", value: "", offset: src.length });
  return toks;
}

export function parseExpression(src: string): ParseResult {
  const refs: ContextRef[] = [];
  const calls: Call[] = [];
  let toks: Tok[];
  try { toks = tokenize(src); } catch (e) {
    const pe = e as ParseError;
    return { refs, calls, errors: [{ message: pe.message, offset: pe.offset }] };
  }
  let pos = 0;
  const peek = () => toks[pos];
  const next = () => toks[pos++];
  const isP = (v: string) => peek().kind === "punct" && peek().value === v;
  const expectP = (v: string) => {
    if (!isP(v)) throw new ParseError(`expected "${v}" but found ${describe(peek())}`, peek().offset);
    return next();
  };

  function orExpr(): void { andExpr(); while (isP("||")) { next(); andExpr(); } }
  function andExpr(): void { eqExpr(); while (isP("&&")) { next(); eqExpr(); } }
  function eqExpr(): void { cmpExpr(); while (isP("==") || isP("!=")) { next(); cmpExpr(); } }
  function cmpExpr(): void { unary(); while (isP("<") || isP("<=") || isP(">") || isP(">=")) { next(); unary(); } }
  function unary(): void { if (isP("!")) { next(); unary(); return; } postfix(); }
  function postfix(): void {
    const ref = primary();
    for (;;) {
      if (isP(".")) {
        next();
        const t = peek();
        if (t.kind === "ident") { next(); ref?.path.push(t.value); }
        else if (t.kind === "punct" && t.value === "*") { next(); ref?.path.push(null); }
        else throw new ParseError(`expected property name after "." but found ${describe(t)}`, t.offset);
      } else if (isP("[")) {
        next();
        const t = peek();
        if (t.kind === "str" && toks[pos + 1]?.value === "]") { next(); ref?.path.push(t.value); }
        else if (t.kind === "punct" && t.value === "*" && toks[pos + 1]?.value === "]") { next(); ref?.path.push(null); }
        else { orExpr(); ref?.path.push(null); }
        expectP("]");
      } else break;
    }
  }
  function primary(): ContextRef | null {
    const t = next();
    if (t.kind === "str" || t.kind === "num") return null;
    if (t.kind === "ident") {
      const lower = t.value.toLowerCase();
      if (isP("(")) {
        calls.push({ name: t.value, offset: t.offset });
        next();
        if (!isP(")")) { orExpr(); while (isP(",")) { next(); orExpr(); } }
        expectP(")");
        return null;
      }
      if (lower === "true" || lower === "false" || lower === "null" || lower === "nan" || lower === "infinity") return null;
      const ref: ContextRef = { root: t.value, path: [], offset: t.offset };
      refs.push(ref);
      return ref;
    }
    if (t.kind === "punct" && t.value === "(") { orExpr(); expectP(")"); return null; }
    throw new ParseError(t.kind === "eof" ? "unexpected end of expression" : `unexpected ${describe(t)}`, t.offset);
  }

  try {
    if (peek().kind === "eof") throw new ParseError("empty expression", 0);
    orExpr();
    if (peek().kind !== "eof") throw new ParseError(`unexpected ${describe(peek())} after end of expression`, peek().offset);
  } catch (e) {
    if (!(e instanceof ParseError)) throw e;
    return { refs, calls, errors: [{ message: e.message, offset: e.offset }] };
  }
  return { refs, calls, errors: [] };
}

function describe(t: Tok): string {
  if (t.kind === "eof") return "end of expression";
  if (t.kind === "str") return "string literal";
  return `"${t.value}"`;
}

/** Find every ${{ ... }} in a string. A "}}" inside a single-quoted string does not close the expression. */
export function extractExpressions(s: string): ExtractResult {
  const expressions: Extracted[] = [];
  const errors: ExprError[] = [];
  let i = 0;
  for (;;) {
    const start = s.indexOf("${{", i);
    if (start < 0) break;
    let j = start + 3; let inStr = false; let end = -1;
    while (j < s.length) {
      const c = s[j];
      if (inStr) {
        if (c === "'") { if (s[j + 1] === "'") { j += 2; continue; } inStr = false; }
        j++; continue;
      }
      if (c === "'") { inStr = true; j++; continue; }
      if (c === "}" && s[j + 1] === "}") { end = j + 2; break; }
      j++;
    }
    if (end < 0) {
      errors.push({ message: "unclosed \"${{\": expression is missing its closing \"}}\"", offset: start });
      break;
    }
    expressions.push({ inner: s.slice(start + 3, end - 2), start, end });
    i = end;
  }
  return { expressions, errors };
}
