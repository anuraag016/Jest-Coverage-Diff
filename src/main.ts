import * as core from '@actions/core'
import * as github from '@actions/github'
import {execSync} from 'child_process'
import {CoverageParser} from './CoverageParser'
import {CoverageDiffChecker} from './CoverageDiffChecker'

async function run(): Promise<void> {
  try {
    const repoName = github.context.repo.repo
    const repoOwner = github.context.repo.owner
    const githubToken = core.getInput('accessToken')
    const fullCoverage = core.getInput('fullCoverageDiff')
    // const optionalArgs = core.getInput('optionalArgs');
    const commandToRun = 'npx jest --coverage'
    // const options: core.InputOptions = { required: true };
    const githubClient = github.getOctokit(githubToken)
    const prNumber = github.context.issue.number
    const branchNameBase = github.context.payload.pull_request?.base.ref
    const branchNameHead = github.context.payload.pull_request?.head.ref
    const codeCoverageNew = execSync(commandToRun).toString()
    execSync('/usr/bin/git fetch')
    execSync(`/usr/bin/git checkout --progress --force ${branchNameBase}`)
    const codeCoveragePrev = execSync(commandToRun).toString()
    const coverageParserNew = new CoverageParser(codeCoverageNew)
    const coverageParserPrev = new CoverageParser(codeCoveragePrev)
    const coverageDiffChecker = new CoverageDiffChecker(
      coverageParserPrev,
      coverageParserNew
    )
    let postMessage = `${coverageParserNew.headerLines[1]}\n${coverageParserNew.headerLines[2]}\n`
    if (fullCoverage) {
      postMessage += coverageDiffChecker.getFullCoverageWithDiff().join('\n')
    } else {
      postMessage += coverageDiffChecker.getOnlyDiffLines().join('\n')
    }
    await githubClient.issues.createComment({
      repo: repoName,
      owner: repoOwner,
      body: `Code coverage comparison ${branchNameBase} vs ${branchNameHead}: \n ${postMessage}`,
      issue_number: prNumber
    })
  } catch (error) {
    core.setFailed(error)
  }
}

run()
