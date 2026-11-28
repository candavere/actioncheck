# probe2 runner evidence

- **Run ID:** `46146446155`
- **Date:** 2026-11-28
- **Workflow:** `probe2` in `candavere/actioncheck-probe2` (private).
- **Repo status:** NOT deleted. Step 8 hit a STOP, so Part D (push, then deletion) did not run. Step 11 deletes this repo only after a successful push. The scratch repo at `/tmp/probe2/probe-repo-v2` was left intact as instructed.
- **Scratch:** `/tmp/probe2/probe-repo-v2`
- **Files here:** `probe2.log` (full, unedited), `probe2-grep.txt`, `probe-repo/` (the whole `probe-repo-v2` folder including the two log files, without `.git`), `lint-output.txt`.
- lint-output.txt was produced by the build at f286356 (before the if: fix).

## Commands run (step 2, verbatim)

```
git init -b main && git add . && git commit -m "probe2: needs/vars in if/env/with/working-directory"
gh repo create candavere/actioncheck-probe2 --private --source . --remote origin
gh variable set X --body probe-value --repo candavere/actioncheck-probe2
git push -u origin main
sleep 5
RUN=$(gh run list --repo candavere/actioncheck-probe2 -w probe2 -L1 --json databaseId -q '.[0].databaseId'); echo "RUN ID: $RUN"
gh run watch "$RUN" --repo candavere/actioncheck-probe2 --exit-status || true
gh run view "$RUN" --repo candavere/actioncheck-probe2 --log > probe2.log
grep -E "PROBE2|CONTROL2|SUMMARY2|Unrecognized|##\[error\]" probe2.log > probe2-grep.txt
```

## CONTROL2 line (verbatim from probe2-grep.txt)

```
probe	control (workflow step)	2026-11-28T12:48:16.9325825Z CONTROL2 needs=[success] vars=[probe-value]
```

## SUMMARY2 line (verbatim from probe2-grep.txt)

```
probe	summary	2026-11-28T12:48:17.0784232Z SUMMARY2 needs_if=success needs_env=failure needs_with=failure needs_workdir=failure vars_if=success vars_env=failure vars_with=failure vars_workdir=failure
```

## PROBE2 "ran" lines (verbatim from probe2-grep.txt)

```
probe	Run ./.github/actions/p-needs-if	2026-11-28T12:48:16.9831684Z PROBE2 needs-if ran
probe	Run ./.github/actions/p-vars-if	2026-11-28T12:48:17.0406136Z PROBE2 vars-if ran
```

## Unrecognized named-value lines (verbatim from probe2-grep.txt)

```
probe	Run ./.github/actions/p-needs-env	﻿2026-11-28T12:48:17.0000229Z ##[error]/home/runner/work/actioncheck-probe2/actioncheck-probe2/./.github/actions/p-needs-env/action.yml (Line: 8, Col: 12): Unrecognized named-value: 'needs'. Located at position 1 within expression: needs.x.result
probe	Run ./.github/actions/p-needs-env	2026-11-28T12:48:17.0023732Z ##[error]GitHub.DistributedTask.ObjectTemplating.TemplateValidationException: The template is not valid. /home/runner/work/actioncheck-probe2/actioncheck-probe2/./.github/actions/p-needs-env/action.yml (Line: 8, Col: 12): Unrecognized named-value: 'needs'. Located at position 1 within expression: needs.x.result
probe	Run ./.github/actions/p-needs-with	﻿2026-11-28T12:48:17.0099478Z ##[error]/home/runner/work/actioncheck-probe2/actioncheck-probe2/./.github/actions/p-needs-with/action.yml (Line: 8, Col: 12): Unrecognized named-value: 'needs'. Located at position 1 within expression: needs.x.result
probe	Run ./.github/actions/p-needs-with	2026-11-28T12:48:17.0116670Z ##[error]GitHub.DistributedTask.ObjectTemplating.TemplateValidationException: The template is not valid. /home/runner/work/actioncheck-probe2/actioncheck-probe2/./.github/actions/p-needs-with/action.yml (Line: 8, Col: 12): Unrecognized named-value: 'needs'. Located at position 1 within expression: needs.x.result
probe	Run ./.github/actions/p-needs-workdir	﻿2026-11-28T12:48:17.0170585Z ##[error]/home/runner/work/actioncheck-probe2/actioncheck-probe2/./.github/actions/p-needs-workdir/action.yml (Line: 7, Col: 26): Unrecognized named-value: 'needs'. Located at position 1 within expression: needs.x.result && '.' || '.'
probe	Run ./.github/actions/p-needs-workdir	2026-11-28T12:48:17.0188125Z ##[error]GitHub.DistributedTask.ObjectTemplating.TemplateValidationException: The template is not valid. /home/runner/work/actioncheck-probe2/actioncheck-probe2/./.github/actions/p-needs-workdir/action.yml (Line: 7, Col: 26): Unrecognized named-value: 'needs'. Located at position 1 within expression: needs.x.result && '.' || '.'
probe	Run ./.github/actions/p-vars-env	﻿2026-11-28T12:48:17.0458145Z ##[error]/home/runner/work/actioncheck-probe2/actioncheck-probe2/./.github/actions/p-vars-env/action.yml (Line: 8, Col: 12): Unrecognized named-value: 'vars'. Located at position 1 within expression: vars.X
probe	Run ./.github/actions/p-vars-env	2026-11-28T12:48:17.0475247Z ##[error]GitHub.DistributedTask.ObjectTemplating.TemplateValidationException: The template is not valid. /home/runner/work/actioncheck-probe2/actioncheck-probe2/./.github/actions/p-vars-env/action.yml (Line: 8, Col: 12): Unrecognized named-value: 'vars'. Located at position 1 within expression: vars.X
probe	Run ./.github/actions/p-vars-with	﻿2026-11-28T12:48:17.0528981Z ##[error]/home/runner/work/actioncheck-probe2/actioncheck-probe2/./.github/actions/p-vars-with/action.yml (Line: 8, Col: 12): Unrecognized named-value: 'vars'. Located at position 1 within expression: vars.X
probe	Run ./.github/actions/p-vars-with	2026-11-28T12:48:17.0546164Z ##[error]GitHub.DistributedTask.ObjectTemplating.TemplateValidationException: The template is not valid. /home/runner/work/actioncheck-probe2/actioncheck-probe2/./.github/actions/p-vars-with/action.yml (Line: 8, Col: 12): Unrecognized named-value: 'vars'. Located at position 1 within expression: vars.X
probe	Run ./.github/actions/p-vars-workdir	﻿2026-11-28T12:48:17.0600086Z ##[error]/home/runner/work/actioncheck-probe2/actioncheck-probe2/./.github/actions/p-vars-workdir/action.yml (Line: 7, Col: 26): Unrecognized named-value: 'vars'. Located at position 1 within expression: vars.X && '.' || '.'
probe	Run ./.github/actions/p-vars-workdir	2026-11-28T12:48:17.0617228Z ##[error]GitHub.DistributedTask.ObjectTemplating.TemplateValidationException: The template is not valid. /home/runner/work/actioncheck-probe2/actioncheck-probe2/./.github/actions/p-vars-workdir/action.yml (Line: 7, Col: 26): Unrecognized named-value: 'vars'. Located at position 1 within expression: vars.X && '.' || '.'
```

## Probe-by-probe comparison

Outcomes are copied from the SUMMARY2 line above. Actioncheck text is copied verbatim from `lint-output.txt`. Where the log has no line, the cell says "not shown in the log".

| Probe | GitHub outcome (SUMMARY2) | actioncheck (lint-output.txt) |
|---|---|---|
| needs_if | success | `evidence/probe2/probe-repo/.github/actions/p-needs-if/action.yml:6:11: error: the "needs" context is not available in composite actions; pass the value in as an input [AC006]` |
| needs_env | failure | `evidence/probe2/probe-repo/.github/actions/p-needs-env/action.yml:8:16: error: the "needs" context is not available in composite actions; pass the value in as an input [AC006]` |
| needs_with | failure | `evidence/probe2/probe-repo/.github/actions/p-needs-with/action.yml:8:16: error: the "needs" context is not available in composite actions; pass the value in as an input [AC006]` |
| needs_workdir | failure | `evidence/probe2/probe-repo/.github/actions/p-needs-workdir/action.yml:7:30: error: the "needs" context is not available in composite actions; pass the value in as an input [AC006]` |
| vars_if | success | `evidence/probe2/probe-repo/.github/actions/p-vars-if/action.yml:6:11: error: the "vars" context is not available in composite actions; pass the value in as an input [AC006]` |
| vars_env | failure | `evidence/probe2/probe-repo/.github/actions/p-vars-env/action.yml:8:16: error: the "vars" context is not available in composite actions; pass the value in as an input [AC006]` |
| vars_with | failure | `evidence/probe2/probe-repo/.github/actions/p-vars-with/action.yml:8:16: error: the "vars" context is not available in composite actions; pass the value in as an input [AC006]` |
| vars_workdir | failure | `evidence/probe2/probe-repo/.github/actions/p-vars-workdir/action.yml:7:30: error: the "vars" context is not available in composite actions; pass the value in as an input [AC006]` |

## Decision

STOP at step 8: `needs_if=success` and `vars_if=success` in SUMMARY2, with `PROBE2 needs-if ran` and `PROBE2 vars-if ran` in the log. No README wording or `src/` was changed, no commit or push was made, and the probe repo was not deleted.
