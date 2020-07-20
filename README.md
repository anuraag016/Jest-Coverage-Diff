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
```
