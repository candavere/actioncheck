# probe3 runner evidence: `needs`/`vars` by `if:` form (bare vs wrapped)

- **Run ID:** `46147369823`
- **Date:** 2026-11-28
- **Workflow repo:** `candavere/actioncheck-probe2` (private, deleted after release).
- **Files here:** `probe3.log` (full, unedited), `probe3-grep.txt`, `probe-repo/` (the probe repository, without `.git`).

## CONTROL3 line (verbatim from probe3-grep.txt)

```
probe	control (workflow step)	2026-11-28T13:00:00.6602256Z CONTROL3 needs=[success] vars=[probe-value]
```

## SUMMARY3 line (verbatim from probe3-grep.txt)

```
probe	summary	2026-11-28T13:00:00.8195644Z SUMMARY3 needs_eq=success needs_neg=success needs_wrapped=failure vars_eq=success vars_neg=success vars_wrapped=failure bogus_if=failure
```

## PROBE3 lines (verbatim from probe3-grep.txt)

```
probe	Run ./.github/actions/p3-needs-eq	2026-11-28T13:00:00.6851647Z ##[start-action display=Run echo "PROBE3 p3-needs-eq ran";id=needs_eq.__run]
probe	Run ./.github/actions/p3-needs-eq	2026-11-28T13:00:00.7002618Z ##[group]Run echo "PROBE3 p3-needs-eq ran"
probe	Run ./.github/actions/p3-needs-eq	2026-11-28T13:00:00.7004108Z ^[[36;1mecho "PROBE3 p3-needs-eq ran"^[[0m
probe	Run ./.github/actions/p3-needs-eq	2026-11-28T13:00:00.7120908Z PROBE3 p3-needs-eq ran
probe	Run ./.github/actions/p3-needs-neg	2026-11-28T13:00:00.7250644Z ##[start-action display=Run echo "PROBE3 p3-needs-neg ran";id=needs_neg.__run]
probe	Run ./.github/actions/p3-vars-eq	2026-11-28T13:00:00.7578122Z ##[start-action display=Run echo "PROBE3 p3-vars-eq ran";id=vars_eq.__run]
probe	Run ./.github/actions/p3-vars-eq	2026-11-28T13:00:00.7610449Z ##[group]Run echo "PROBE3 p3-vars-eq ran"
probe	Run ./.github/actions/p3-vars-eq	2026-11-28T13:00:00.7611132Z ^[[36;1mecho "PROBE3 p3-vars-eq ran"^[[0m
probe	Run ./.github/actions/p3-vars-eq	2026-11-28T13:00:00.7713137Z PROBE3 p3-vars-eq ran
probe	Run ./.github/actions/p3-vars-neg	2026-11-28T13:00:00.7815435Z ##[start-action display=Run echo "PROBE3 p3-vars-neg ran";id=vars_neg.__run]
```

## Unrecognized named-value and related error lines (verbatim from probe3-grep.txt)

```
probe	Run ./.github/actions/p3-needs-wrapped	﻿2026-11-28T13:00:00.7418964Z ##[error]/home/runner/work/actioncheck-probe2/actioncheck-probe2/./.github/actions/p3-needs-wrapped/action.yml (Line: 6, Col: 11): Unrecognized named-value: 'needs'. Located at position 1 within expression: needs.x.result == 'success'
probe	Run ./.github/actions/p3-needs-wrapped	2026-11-28T13:00:00.7432022Z ##[error]/home/runner/work/actioncheck-probe2/actioncheck-probe2/./.github/actions/p3-needs-wrapped/action.yml (Line: 6, Col: 11): Unexpected symbol: '${{'. Located at position 1 within expression: ${{ needs.x.result == 'success' }}
probe	Run ./.github/actions/p3-needs-wrapped	2026-11-28T13:00:00.7453066Z ##[error]GitHub.DistributedTask.ObjectTemplating.TemplateValidationException: The template is not valid. /home/runner/work/actioncheck-probe2/actioncheck-probe2/./.github/actions/p3-needs-wrapped/action.yml (Line: 6, Col: 11): Unrecognized named-value: 'needs'. Located at position 1 within expression: needs.x.result == 'success',/home/runner/work/actioncheck-probe2/actioncheck-probe2/./.github/actions/p3-needs-wrapped/action.yml (Line: 6, Col: 11): Unexpected symbol: '${{'. Located at position 1 within expression: ${{ needs.x.result == 'success' }}
probe	Run ./.github/actions/p3-needs-wrapped	2026-11-28T13:00:00.7477215Z ##[error]Failed to load /home/runner/work/actioncheck-probe2/actioncheck-probe2/./.github/actions/p3-needs-wrapped/action.yml
probe	Run ./.github/actions/p3-vars-wrapped	﻿2026-11-28T13:00:00.7865459Z ##[error]/home/runner/work/actioncheck-probe2/actioncheck-probe2/./.github/actions/p3-vars-wrapped/action.yml (Line: 6, Col: 11): Unrecognized named-value: 'vars'. Located at position 1 within expression: vars.X == 'probe-value'
probe	Run ./.github/actions/p3-vars-wrapped	2026-11-28T13:00:00.7872244Z ##[error]/home/runner/work/actioncheck-probe2/actioncheck-probe2/./.github/actions/p3-vars-wrapped/action.yml (Line: 6, Col: 11): Unexpected symbol: '${{'. Located at position 1 within expression: ${{ vars.X == 'probe-value' }}
probe	Run ./.github/actions/p3-vars-wrapped	2026-11-28T13:00:00.7893263Z ##[error]GitHub.DistributedTask.ObjectTemplating.TemplateValidationException: The template is not valid. /home/runner/work/actioncheck-probe2/actioncheck-probe2/./.github/actions/p3-vars-wrapped/action.yml (Line: 6, Col: 11): Unrecognized named-value: 'vars'. Located at position 1 within expression: vars.X == 'probe-value',/home/runner/work/actioncheck-probe2/actioncheck-probe2/./.github/actions/p3-vars-wrapped/action.yml (Line: 6, Col: 11): Unexpected symbol: '${{'. Located at position 1 within expression: ${{ vars.X == 'probe-value' }}
probe	Run ./.github/actions/p3-vars-wrapped	2026-11-28T13:00:00.7911367Z ##[error]Failed to load /home/runner/work/actioncheck-probe2/actioncheck-probe2/./.github/actions/p3-vars-wrapped/action.yml
probe	Run ./.github/actions/p3-bogus-if	﻿2026-11-28T13:00:00.7953211Z ##[error]/home/runner/work/actioncheck-probe2/actioncheck-probe2/./.github/actions/p3-bogus-if/action.yml (Line: 6, Col: 11): Unrecognized named-value: 'bogus'. Located at position 1 within expression: bogus.x == ''
probe	Run ./.github/actions/p3-bogus-if	2026-11-28T13:00:00.7983649Z ##[error]GitHub.DistributedTask.ObjectTemplating.TemplateValidationException: The template is not valid. /home/runner/work/actioncheck-probe2/actioncheck-probe2/./.github/actions/p3-bogus-if/action.yml (Line: 6, Col: 11): Unrecognized named-value: 'bogus'. Located at position 1 within expression: bogus.x == ''
probe	Run ./.github/actions/p3-bogus-if	2026-11-28T13:00:00.8013170Z ##[error]Failed to load /home/runner/work/actioncheck-probe2/actioncheck-probe2/./.github/actions/p3-bogus-if/action.yml
```

## Probe-by-probe comparison

Every row below was checked against `probe3-grep.txt`: the `if: form` column against the probe action.yml files, the `ran line yes/no` column against the `PROBE3 ... ran` lines, and the `outcome` column against the SUMMARY3 line. All seven rows match.

| probe | if: form | ran line yes/no | outcome |
|---|---|---|---|
| needs-eq | bare | yes | success |
| needs-neg | bare | no | success |
| needs-wrapped | wrapped | no | failure |
| vars-eq | bare | yes | success |
| vars-neg | bare | no | success |
| vars-wrapped | wrapped | no | failure |
| bogus-if | bare | no | failure |
