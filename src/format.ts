import { RULES, type Diagnostic } from "./lint.js";

export function toText(diags: Diagnostic[]): string {
  return diags.map((d) => `${d.file}:${d.line}:${d.column}: ${d.level}: ${d.message} [${d.ruleId}]\n`).join("");
}

// https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands
const escData = (s: string) => s.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
const escProp = (s: string) => escData(s).replace(/:/g, "%3A").replace(/,/g, "%2C");

export function toGithub(diags: Diagnostic[]): string {
  return diags.map((d) =>
    `::${d.level} file=${escProp(d.file)},line=${d.line},col=${d.column},title=${escProp(d.ruleId)}::${escData(d.message)}\n`).join("");
}

const toUri = (file: string) => file.replace(/\\/g, "/").split("/").map(encodeURIComponent).join("/");

export function toSarif(diags: Diagnostic[], version: string) {
  const rules = RULES.map((r) => ({
    id: r.id,
    name: r.name,
    shortDescription: { text: r.description },
    defaultConfiguration: { level: "error" },
  }));
  return {
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    version: "2.1.0",
    runs: [{
      tool: { driver: { name: "actioncheck", version, rules } },
      results: diags.map((d) => ({
        ruleId: d.ruleId,
        ruleIndex: RULES.findIndex((r) => r.id === d.ruleId),
        level: d.level,
        message: { text: d.message },
        locations: [{
          physicalLocation: {
            artifactLocation: { uri: toUri(d.file) },
            region: { startLine: d.line, startColumn: d.column },
          },
        }],
      })),
    }],
  };
}
