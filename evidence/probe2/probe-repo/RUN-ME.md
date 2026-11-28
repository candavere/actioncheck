# probe2: needs / vars in if:, env:, with:, working-directory: of composite steps

Extends run 46002009819, which covered only `run:`. Prereqs: gh signed in as candavere.

```bash
cd probe-repo-v2
git init -b main && git add . && git commit -m "probe2: needs/vars in if/env/with/working-directory"
gh repo create candavere/actioncheck-probe2 --private --source . --remote origin
gh variable set X --body probe-value --repo candavere/actioncheck-probe2
git push -u origin main
sleep 5
RUN=$(gh run list --repo candavere/actioncheck-probe2 -w probe2 -L1 --json databaseId -q '.[0].databaseId')
echo "RUN ID: $RUN"
gh run watch "$RUN" --repo candavere/actioncheck-probe2 --exit-status || true
gh run view "$RUN" --repo candavere/actioncheck-probe2 --log > probe2.log   # keep the FULL log this time
grep -E "PROBE2|CONTROL2|SUMMARY2|Unrecognized|##\[error\]" probe2.log
```

Keep probe2.log (the whole file) and the run ID before you delete the repo, then commit them under evidence/probe2/ with these files.

Reading: `<ctx>_<field>=failure` plus `Unrecognized named-value: '<ctx>'` means the field rejects it. `success` plus a printed value means it works there. For `if`, success with no "ran" line means the expression ran and came out false; report that case.
