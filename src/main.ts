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
    const fullCoverage = core.getInput('fullCoverageDiff')
    // const optionalArgs = core.getInput('optionalArgs');
    const commandToRun =
      'npx jest --coverage --coverageReporters="json-summary" --coverageDirectory="./"'
    // const options: core.InputOptions = { required: true };
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
    execSync(commandToRun)
    const codeCoverageOld = <CoverageReport>(
      JSON.parse(fs.readFileSync('coverage-summary.json').toString())
    )
    const currentDirectory = execSync('pwd').toString()
    const diffChecker: DiffChecker = new DiffChecker(
      codeCoverageNew,
      codeCoverageOld
    )
    let messageToPost =
      'File | % Stmts | % Branch | % Funcs | % Lines \n -----|---------|----------|---------|------ \n'
    messageToPost += diffChecker
      .getCoverageDetails(true, currentDirectory)
      .join('\n')
    await githubClient.issues.createComment({
      repo: repoName,
      owner: repoOwner,
      body: `Code coverage comparison ${branchNameBase} vs ${branchNameHead}: \n ${messageToPost}`,
      issue_number: prNumber
    })
  } catch (error) {
    core.setFailed(error)
  }
}

run()
