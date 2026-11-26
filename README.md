# actioncheck

Lint the **steps of composite GitHub Actions** (`action.yml`) on their own, with no workflow needed.

actionlint (1.7.12) checks workflows. When a workflow uses a local action, it reads that action's inputs but not its `steps:`. The [kjanat/actionlint](https://github.com/kjanat/actionlint) fork does check composite steps: missing shell, unavailable contexts, duplicate ids and bad refs. Neither one catches `${{ inputs.x }}` for an input the action never declared, or `${{ steps.x.outputs.y }}` for a step id that doesn't exist. actioncheck does, standalone on any action.yml, with one runtime dependency. Use it next to them, not instead of them.

| Rule | Catches |
|---|---|
| AC002 | a `run:` step with no `shell:`, which composite actions require |
| AC003 | `inputs.foo` used but not declared (error), or declared but never used (warning) |
| AC004 | `steps.foo` where no step has id `foo`, or the step only runs later; duplicate step ids; outputs pointing at missing steps |
| AC006 | broken `${{ }}` expressions, unknown functions, typo'd contexts, and `secrets` / `needs`, which composite actions can't use |
| AC007 | `uses:` with no `@ref` or in a malformed shape (error); a ref that isn't a full commit SHA (warning) |

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
```

Exit codes: `0` no errors (warnings are allowed), `1` errors found, `2` usage or file error. Non-composite actions (node, docker) are skipped.

### In a workflow

```yaml
- uses: actions/setup-node@v7
  with:
    node-version: 22
- run: npx actioncheck --format github
```

## What it does not do

- Lint workflow files. Use [actionlint](https://github.com/rhysd/actionlint) for those.
- Security auditing (template injection, credential leaks). Use [zizmor](https://github.com/zizmorcore/zizmor).
- Check `inputs.*.default` expressions, or the scripts inside `run:`.

Requires Node 20 or later. One runtime dependency (`yaml`).

## License

MIT
