# Changelog

## 0.2.0 (2026-11-28)

### Added
- `--no-unused-inputs`: turn off the AC003 warning for inputs that are declared but never read.
- README section on which input reads AC003 counts, and what it does not check.
- `evidence/`: GitHub runner logs (runs 46002009819, 46146446155, 46147369823) behind the `needs`/`vars` rules.

### Changed
- AC006 no longer reports `needs` or `vars` in a step's bare `if:` (written without `${{ }}`), where GitHub's runner accepts them and compares their real values. They are still errors in `run:`, `env:`, `with:`, `working-directory:` and a `${{ }}`-wrapped `if:`, where the runner rejects them with `Unrecognized named-value`. The error message now says so.
- README: corrected the comparison with other linters. jactionlint 2.6.0 does catch undeclared inputs and missing step ids.

### Unchanged
- `secrets` is still an error anywhere in a composite action.

## 0.1.0 (2026-11-26)

- First release: AC000, AC002, AC003, AC004, AC006, AC007; text, SARIF and GitHub annotation output.
