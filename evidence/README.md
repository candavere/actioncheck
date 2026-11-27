# Runner evidence: `needs` and `vars` in composite actions

- GitHub run: **`46002009819`** — workflow `probe`, repo `candavere/actioncheck-probe` (private scratch repo, deleted after the run).
- Date: 2026-11-27. Runner: `ubuntu-latest`, Node 20 runner process, `actions/checkout@v7`.
- Commands used (see `probe-repo/RUN-ME.md`): `gh variable set X --body probe-value`, push to trigger, `gh run watch`, `gh run view 46002009819 --repo candavere/actioncheck-probe --log > probe.log`, then:
  `grep -E "PROBE|CONTROL|SUMMARY|Unrecognized|##\[error\]" probe.log`.
- `probe.log` here holds the lines that grep printed from that run. The full `--log` output was held in the scratch repo and was removed when the repo was deleted; nothing in this file is reconstructed or inferred.

## Result

The workflow job `probe` succeeded because every action step was `continue-on-error: true`; the individual outcomes came from the summary step:

```
SUMMARY needs=failure vars=failure matrix=success steps=success all=failure
SUMMARY p_steps.outputs.value=[from-first] p_all.outputs.value=[]
```

Runner errors for the two contexts (from `probe.log`):

```
Unrecognized named-value: 'needs'. Located at position 1 within expression: needs.x.result
Unrecognized named-value: 'vars'. Located at position 1 within expression: vars.X
```

Controls that did resolve:

```
PROBE matrix.os=[ubuntu-latest]
PROBE steps.first.outputs.value=[from-first]
CONTROL vars.X=[probe-value]
CONTROL needs.x.result=[success]
```

`CONTROL` ran in a workflow step, so `needs`/`vars` exist there. The failures are specific to composite action steps.

## Scope

This probe only exercised expressions in a composite action's **`run:`** field (plus the `outputs.*.value` case for `steps` in `probe-steps`). It does not establish behaviour for `if:`, `env:`, `with:` or other step fields, so the verified claim is `run:`-only. No probe for those other fields was added.

## Current build against these probe files

After rebuilding (`npm test`, 53/53 pass), `node dist/src/cli.js evidence/probe-repo/.github/actions` exited 1 with four AC006 errors — two `needs` (probe-all line 15, probe-needs line 7) and two `vars` (probe-all line 16, probe-vars line 7) — and no findings on `probe-matrix` or `probe-steps`. That agrees with the runner outcomes above. Exact output: `evidence/lint-output.txt`.
