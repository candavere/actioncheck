# actioncheck vs jactionlint on the 19-action corpus (2026-11-27)

- jactionlint 2.6.0: the latest release on PyPI and GitHub releases on 2026-11-27. Installed with `pip install jactionlint==2.6.0` into a venv (linux/arm64 wheel, go1.27.4). Run: `jactionlint --no-online --shellcheck= --format json <19 files>` (default profile), and again with `--profile correctness`.
- actioncheck: this working tree (0.1.0 plus the task 2 change). Run: `node dist/src/cli.js corpus/actions` (text, plus `--format sarif`).
- Files: jactionlint-default.json, jactionlint-correctness.json, *.stderr, actioncheck.txt, actioncheck.sarif, diff-context.txt (each finding with its source lines), labels.tsv (hand labels).

## Counts
| Tool | Rule | Findings |
|---|---|---|
| actioncheck | AC002 / AC003 / AC004 / AC006 | 0 / 0 / 0 / 0 |
| actioncheck | AC007 (warning) | 1 |
| jactionlint (default) | template-injection | 31 |
| jactionlint | github-env | 10 |
| jactionlint | obfuscation | 9 |
| jactionlint | unverified-download | 2 |
| jactionlint | unpinned-uses | 2 |
| jactionlint | expression-type | 2 |
| jactionlint | adhoc-packages | 1 |
| jactionlint | context-availability | 1 |
| jactionlint (correctness profile only) | expression-type 2, context-availability 1 | 3 |

Overlap: 1 (pre-commit `actions/cache@v4` unpinned: AC007 = unpinned-uses). Differing: 57, all jactionlint-only, 0 actioncheck-only.

## Hand labels for the 57 differing findings
TRUE = the condition is in the source and is a real issue. FALSE = the claimed effect cannot happen, or the flagged behaviour is the input's purpose. UNCLEAR = the pattern is there, but impact depends on what the calling workflow passes, or on runner behaviour not verified here.

| Rule | TRUE | FALSE | UNCLEAR |
|---|---|---|---|
| template-injection (31) | 0 | 2 | 29 |
| github-env (10) | 0 | 2 | 8 |
| obfuscation (9) | 9 | 0 | 0 |
| unverified-download (2) | 2 | 0 | 0 |
| unpinned-uses (1 differing) | 1 | 0 | 0 |
| expression-type (2) | 0 | 0 | 2 |
| adhoc-packages (1) | 1 | 0 | 0 |
| context-availability (1) | 0 | 0 | 1 |
| Total (57) | 13 | 4 | 40 |

Where the TRUE ones sit relative to actioncheck's rules:
- obfuscation x9: in `inputs.*.default`, which actioncheck does not lint (documented).
- unpinned-uses x1: a `docker://` tag; AC007 doesn't check docker pinning.
- unverified-download x2 and adhoc-packages x1: inside `run:` scripts; also out of scope.

None is a miss inside AC002–AC007's stated scope. No rule was changed.
