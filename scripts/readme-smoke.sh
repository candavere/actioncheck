#!/usr/bin/env bash
# Runs the README's "Try it" block verbatim in the current (fresh) folder and diffs
# its output against the README's expected output, then exercises the Usage formats.
# Expects actioncheck installed locally first: npm install <path-to-actioncheck-x.y.z.tgz>
set -u
README="$(cd "$(dirname "$0")/.." && pwd)/README.md"
fail=0
awk '/^## Try it/{f=1} f&&/^```bash$/{c=1;next} c&&/^```$/{exit} c' "$README" > try.sh
awk '/^## Try it/{f=1} f&&/^```text$/{c=1;next} c&&/^```$/{exit} c' "$README" > expected.txt
bash try.sh > actual.txt 2>&1; code=$?
if [ "$code" != "1" ]; then echo "FAIL: expected exit 1 from Try it, got $code"; fail=1; fi
if ! diff -u expected.txt actual.txt; then echo "FAIL: output differs from README"; fail=1; fi
npx actioncheck --format sarif > actioncheck.sarif
node -e "const d=JSON.parse(require('fs').readFileSync('actioncheck.sarif','utf8')); if(d.version!=='2.1.0'||d.runs[0].results.length!==6) process.exit(1)" || { echo "FAIL: sarif"; fail=1; }
npx actioncheck --format github > gh.txt
[ "$(grep -c '^::error file=' gh.txt)" = "5" ] && [ "$(grep -c '^::warning file=' gh.txt)" = "1" ] || { echo "FAIL: github format"; cat gh.txt; fail=1; }
npx actioncheck .github/actions/hello/action.yml .github > /dev/null 2>&1; [ $? = 1 ] || { echo "FAIL: path args"; fail=1; }
npx actioncheck --version || fail=1
[ $fail = 0 ] && echo "README smoke: PASS" || echo "README smoke: FAIL"
exit $fail
