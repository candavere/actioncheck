# needs / vars probe — commands for the owner

Prereqs: gh CLI signed in as candavere.

```bash
cd probe-repo                       # this folder, unzipped
git init -b main && git add . && git commit -m "probe needs/vars/matrix/steps in composite actions"
gh repo create candavere/actioncheck-probe --private --source . --remote origin
gh variable set X --body probe-value --repo candavere/actioncheck-probe
git push -u origin main             # the push triggers the workflow
sleep 5
RUN=$(gh run list --repo candavere/actioncheck-probe -w probe -L1 --json databaseId -q '.[0].databaseId')
gh run watch "$RUN" --repo candavere/actioncheck-probe --exit-status || true
gh run view "$RUN" --repo candavere/actioncheck-probe --log > probe.log
grep -E "PROBE|CONTROL|SUMMARY|Unrecognized|##\[error\]" probe.log
```

Paste the output of the last line (or attach probe.log).

Note: the variable is created before the push, so the first run already sees it. If the push ran before `gh variable set`, re-run with `gh workflow run probe --repo candavere/actioncheck-probe`.

What each result means:
- `PROBE vars.X=[probe-value]` and `vars=success` -> vars IS available in composite steps; AC006's vars error is a false positive.
- `Unrecognized named-value: 'vars'` and `vars=failure` -> runner rejects it; AC006 is right.
- Same reading for `needs`. `matrix` and `steps` are the controls that should pass.
- An empty `[]` with `success` means the context exists but is empty there. Report that case, it is neither of the above.
