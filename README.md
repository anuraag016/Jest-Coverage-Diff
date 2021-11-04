# Jane Development Tips:
## Development in this repo

For ease of testing it's easiest to make changes in a new branch.

```
git co -b my-new-branch
```
Make any changes you like in the `src/` directory.

Run the following command to lint, prettify, build, pack and test your code.
```
npm run all
```

Add the changes in `src/` and the new changes in `dist/` to your commit.
```
git add . && git commit
```

Push the changes to github.
```
git push
```

## Testing with the janeapp/jane repo
Github actions can be told which branch to run against.

Create a new testing branch in the jane repo
```
git co -b testing-branch
```

Update the `.github/workflows/jest_coverage.yml` file which defines the coverage action. Update the Jest Coverage Diff step to point at the new branch you created in this repo.
```
...
      - name: Jest Coverage Diff
        uses: janeapp/Jest-Coverage-Diff@my-new-branch
        with:
          runCommand: npx jest --ci --runInBand --coverage --collectCoverage=true --coverageDirectory='./' --coverageReporters="json-summary"
...
```

Also make any changes to code/tests that will be useful for testing the changes you made to this action.

Commit and push your changes to github
```
git add . && git commit
```

Create a temporary PR on github targeting your new `testing-branch`

The action should run the code you've changed in `my-new-branch`. To continue testing you can keep pushing changes to this PR.

When you're happy with the results, merge your new banch into master in this repo. Since the master branch of `jane` still points at the master branch of this repo, your changes will be included in future action runs

## Tagging
We could consider tagging releases in this branch and pointing the `jest_coverage.yml` file at a particular tag. Because we're only being consumed in one place and development should be pretty sporadic I didn't decide to go this route, but it wouldn't be hard to implement


&nbsp;
&nbsp;
&nbsp;

---
# Original Readme follows:
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

```
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
      id: testCovergae
      uses: anuraag016/Jest-Coverage-Diff@master
      with:
        fullCoverageDiff: false // defaults to false, if made true whole coverage report is commented with the diff
        runCommand: "npx jest --collectCoverageFrom='[\"src/**/*.{js,jsx,ts,tsx}\"]' --coverage --collectCoverage=true --coverageDirectory='./' --coverageReporters='json-summary' --forceExit --detectOpenHandles test/.*test.*"
        delta: 0.5
```
