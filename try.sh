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
