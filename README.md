# actioncheck

[![npm](https://img.shields.io/npm/v/actioncheck)](https://www.npmjs.com/package/actioncheck) [![CI](https://github.com/candavere/actioncheck/actions/workflows/ci.yml/badge.svg)](https://github.com/candavere/actioncheck/actions/workflows/ci.yml) [![license: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

Lint the **steps of composite GitHub Actions** (`action.yml`) on their own, with no workflow needed.

actionlint (1.7.12) checks workflows. When a workflow uses a local action, it reads that action's inputs but not its `steps:`. The [kjanat/actionlint](https://github.com/kjanat/actionlint) fork does check composite steps: missing shell, unavailable contexts, duplicate ids and bad refs. Neither one catches `${{ inputs.x }}` for an input the action never declared, or `${{ steps.x.outputs.y }}` for a step id that doesn't exist. actioncheck does, standalone on any action.yml, with one runtime dependency. Use it next to them, not instead of them.

| Rule | Catches |
|---|---|
| AC002 | a `run:` step with no `shell:`, which composite actions require |
| AC003 | `inputs.foo` used but not declared (error), or declared but never used (warning) |
| AC004 | `steps.foo` where no step has id `foo`, or the step only runs later; duplicate step ids; outputs pointing at missing steps |
| AC006 | broken `${{ }}` expressions, unknown functions, typo'd contexts, and `secrets`, `needs` and `vars`, which composite actions can't use in `run:` expressions (see below) |
| AC007 | `uses:` with no `@ref` or in a malformed shape (error); a ref that isn't a full commit SHA (warning) |

## Install

No install needed: `npx actioncheck` runs the latest version from npm. To pin it in a project:

```bash
npm install --save-dev actioncheck
```

## Try it

```bash
mkdir -p .github/actions/hello
cat > .github/actions/hello/action.yml <<'YAML'
name: hello
description: says hello
inputs:
  who:
    description: who to greet
runs:
  using: composite
  steps:
    - run: echo "Hello ${{ inputs.whom }}"
    - uses: actions/checkout
    - shell: bash
      run: echo "${{ secrets.GITHUB_TOKEN }} ${{ steps.build.outputs.path }}"
YAML
npx actioncheck
```

```text
.github/actions/hello/action.yml:4:3: warning: input "who" is declared but never used in this action [AC003]
.github/actions/hello/action.yml:9:7: error: "run" step has no "shell"; composite actions require one (for example "shell: bash") [AC002]
.github/actions/hello/action.yml:9:28: error: input "whom" is not declared in this action's inputs (declared: who) [AC003]
.github/actions/hello/action.yml:10:13: error: "uses: actions/checkout" has no ref; add "@<commit-sha>" (or a tag) [AC007]
.github/actions/hello/action.yml:12:22: error: the "secrets" context is not available in composite actions; pass the secret in as an input [AC006]
.github/actions/hello/action.yml:12:50: error: step id "build" is not defined in this action [AC004]
actioncheck: 1 composite action(s) checked, 5 error(s), 1 warning(s)
```

## Usage

```bash
npx actioncheck                              # ./action.yml, ./action.yaml and .github/actions/**
npx actioncheck path/to/action.yml some/dir  # files, or directories searched recursively
npx actioncheck --format sarif > actioncheck.sarif
npx actioncheck --format github              # ::error annotations for GitHub Actions logs
npx actioncheck --no-unused-inputs           # skip the "declared but never used" warnings
```

Exit codes: `0` no errors (warnings are allowed), `1` errors found, `2` usage or file error. Non-composite actions (node, docker) are skipped.

### In a workflow

```yaml
- uses: actions/checkout@v7
- uses: actions/setup-node@v7
  with:
    node-version: 22
- run: npx --yes actioncheck@0.1.0 --format github
```

### Inputs (AC003): what is checked

| Case | Result |
|---|---|
| Declared under `inputs:` and read as `inputs.name` or `inputs['name']` | OK (names are case-insensitive) |
| Read but not declared | error at each read |
| Declared but never read | warning; turn it off with `--no-unused-inputs` |
| Declared with `deprecationMessage` and never read | not reported (kept on purpose for compatibility) |
| The whole object is read (`toJSON(inputs)`) or a key is computed (`inputs[matrix.k]`) | no unused-input warnings for that file, since any input could be read |

Reads are found in `${{ }}` expressions in every step key except `uses` and `id` (`run`, `env`, `with`, `if` with or without `${{ }}`, `working-directory`, `name`, and so on) and in `outputs.*.value`.

Not checked:

- `inputs.*.default`. Expressions there are not linted at all, and a read there does not count as a use.
- `$INPUT_NAME` in scripts. Composite actions don't get those variables, so they are not counted as reads.
- `required:`, and whether a caller passes the input. That needs the workflow; actionlint and jactionlint check it.

### `needs` and `vars` in `run:` expressions

GitHub's own runner rejects `needs.x.result` and `vars.X` inside a composite action's `run:` expression: run `46002009819` logged `Unrecognized named-value: 'needs'` and `Unrecognized named-value: 'vars'`, and its summary step printed `SUMMARY needs=failure vars=failure matrix=success steps=success all=failure`. The same expressions in a workflow step printed `CONTROL vars.X=[probe-value]` and `CONTROL needs.x.result=[success]`, so those contexts exist in workflows but not in composite action steps. Evidence: `evidence/probe.log`, `evidence/probe-repo/` and `evidence/README.md`. This confirms actioncheck's AC006 errors for these contexts in `run:` expressions only; `if:`, `env:`, `with:` and other step fields were not probed.

## What it does not do

- Lint workflow files. Use [actionlint](https://github.com/rhysd/actionlint) for those.
- Security auditing (template injection, credential leaks). Use [zizmor](https://github.com/zizmorcore/zizmor).
- Check `inputs.*.default` expressions, or the scripts inside `run:`.

Requires Node 20 or later. One runtime dependency (`yaml`).

## License

MIT © candavere
