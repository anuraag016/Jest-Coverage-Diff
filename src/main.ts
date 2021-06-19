import * as core from '@actions/core'
import * as github from '@actions/github'
import {execSync} from 'child_process'
import fs from 'fs'
import {CoverageReport} from './Model/CoverageReport'
import {DiffChecker} from './DiffChecker'

async function run(): Promise<void> {
  try {
    const repoName = github.context.repo.repo
    const repoOwner = github.context.repo.owner
    const githubToken = core.getInput('accessToken')
    const fullCoverage = JSON.parse(core.getInput('fullCoverageDiff'))
    const commandToRun = core.getInput('runCommand')
    const commandAfterSwitch = core.getInput('runCommand')
    const delta = Number(core.getInput('delta'))
    const githubClient = github.getOctokit(githubToken)
    const prNumber = github.context.issue.number
    const branchNameBase = github.context.payload.pull_request?.base.ref
    const branchNameHead = github.context.payload.pull_request?.head.ref
    execSync(commandToRun)
    const codeCoverageNew = <CoverageReport>(
      JSON.parse(fs.readFileSync('coverage-summary.json').toString())
    )
    execSync('/usr/bin/git fetch')
    execSync('/usr/bin/git stash')
    execSync(`/usr/bin/git checkout --progress --force ${branchNameBase}`)
    if (commandAfterSwitch) {
      execSync(commandAfterSwitch)
    }
    execSync(commandToRun)
    const codeCoverageOld = <CoverageReport>(
      JSON.parse(fs.readFileSync('coverage-summary.json').toString())
    )
    const currentDirectory = execSync('pwd')
      .toString()
      .trim()
    const diffChecker: DiffChecker = new DiffChecker(
      codeCoverageNew,
      codeCoverageOld
    )
    let messageToPost = `## Test coverage results :test_tube: \n
    Code coverage diff between base branch:${branchNameBase} and head branch: ${branchNameHead} \n`
    const coverageDetails = diffChecker.getCoverageDetails(
      !fullCoverage,
      `${currentDirectory}/`
    )
    if (coverageDetails.length === 0) {
      messageToPost =
        'No changes to code coverage between the base branch and the head branch'
    } else {
      messageToPost +=
        'Status | File | % Stmts | % Branch | % Funcs | % Lines \n -----|-----|---------|----------|---------|------ \n'
      messageToPost += coverageDetails.join('\n')
    }
    await githubClient.issues.createComment({
      repo: repoName,
      owner: repoOwner,
      body: messageToPost,
      issue_number: prNumber
    })

    // check if the test coverage is falling below delta/tolerance.
    if (diffChecker.checkIfTestCoverageFallsBelowDelta(delta)) {
      messageToPost = `Current PR reduces the test coverage percentage by ${delta} for some tests`
      await githubClient.issues.createComment({
        repo: repoName,
        owner: repoOwner,
        body: messageToPost,
        issue_number: prNumber
      })
      throw Error(messageToPost)
    }
  } catch (error) {
    core.setFailed(error)
  }
}

run()
