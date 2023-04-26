# Jest coverage diff

Use the action to get jest coverage diff for pull requests as a comment on the pull request
Helps the code reviewer to get the high level view of code coverage changes without leaving the pull request window

example:

Code coverage comparison master vs testBranch:

 File | % Stmts | % Branch | % Funcs | % Lines
 -----|---------|----------|---------|------
total | ~~99.55~~ **97.73** | ~~100~~ **96.97** | ~~97.96~~ **95.92** | ~~99.54~~ **97.7**
src/Error/TestError.ts | ~~100~~ **77.78** | ~~100~~ **100** | ~~100~~ **66.67** | ~~100~~ **77.78**
src/Utility/Utility.ts | ~~96.67~~ **90** | ~~100~~ **75** | ~~88.89~~ **88.89** | ~~96.67~~ **90**

# How It Works

uses the following jest command to get code coverage summary as json for the pull request.
```bash
npx jest --coverage --coverageReporters="json-summary"
```

Then switches branch to the base branch on which the pull request has been raised and runs the same command again.
Calculates the diff between the two reports to figure out additions, removals, increase or decrease in code coverage.
And then posts that diff as a comment on the PR

NOTE : The action will work perfectly only for pull requests. Have not been tested with other events or on schedule workflows

# Configuration

The action assumes jest configuration and jest module already present in the workflow and uses the installed module and the already present config to run the tests.

**NEW:**

 - The action now supports runnning a command just after switching to base branch, this is extremely helpful in cases where there might be some packages removed in the pull request raised, in such cases there now is a possibility to re run the npm ci/npm install commands before running the jset coverage on base branch. Use `afterSwitchCommand` variable to pass a custom command to be run after switching to base branch.
 - The action now supports custom run command, for custom use cases, using the variable runCommand, you can now pass your own command to run. Following is an example where we want to collect coverage from only few files out of all the code and want to use custom options such as `forceExit` & `detectOpenHandles`.
```bash
   runCommand: "npx jest --collectCoverageFrom='[\"src/**/*.{js,jsx,ts,tsx}\"]' --coverage --collectCoverage=true --coverageDirectory='./' --coverageReporters='json-summary' --forceExit --detectOpenHandles test/.*test.*"
```
**NOTE:** If using custom command, `--coverage --collectCoverage=true --coverageDirectory='./' --coverageReporters='json-summary'`, these options are necessary for the action to work properly. These options tells jest to collect the coverage in json summary format and put the final output in the root folder. Since these are necessary, will make the action add them automatically in the next version.

 - Do you want to fail the workflow if the commited code decreases the percentage below a tolerable level? Do you to start a healthy culture of writing test cases?
 The action now also supports failing the run if percentage diff is more than a specified delta value for any file, you can specify the delta value using the variable delta
 ```bash
   delta: 1 // the action will fail if any of the percentage dip is more than 1% for any changed file
 ```

Sample workflow for running this action

```yaml
name: Node.js CI

on: pull_request

jobs:
  build:
    strategy:
      matrix:
        node-version: [14.x]
        platform: [ubuntu-latest]
    runs-on: ${{ matrix.platform }}
    steps:
    - uses: actions/checkout@v2
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v1
      with:
        node-version: ${{ matrix.node-version }}
    - run: npm ci
    - name: TestCoverage
      id: testCoverage
      uses: anuraag016/Jest-Coverage-Diff@master
      with:
        fullCoverageDiff: false # defaults to false, if made true whole coverage report is commented with the diff
        directory: ./src # defaults to '.'
        runCommand: "npx jest --collectCoverageFrom='[\"src/**/*.{js,jsx,ts,tsx}\"]' --coverage --collectCoverage=true --coverageDirectory='./' --coverageReporters='json-summary' --forceExit --detectOpenHandles test/.*test.*"
        delta: 0.5
```
