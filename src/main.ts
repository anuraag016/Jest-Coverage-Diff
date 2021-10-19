import * as core from '@actions/core'
import * as github from '@actions/github'
import {execSync} from 'child_process'
import fs from 'fs'
import {CoverageReport} from './Model/CoverageReport'
import {DiffChecker} from './DiffChecker'

const safeExec = (cmd: string) => execSync(cmd, {stdio: 'ignore'})

const coverageLabel = 'jest-coverage-down'

async function run(): Promise<void> {
  try {
    const repoName = github.context.repo.repo
    const repoOwner = github.context.repo.owner
    const githubToken = core.getInput('accessToken')
    const fullCoverage = JSON.parse(core.getInput('fullCoverageDiff'))
    const commandToRun = core.getInput('runCommand')
    const commandAfterSwitch = core.getInput('afterSwitchCommand')
    const delta = Number(core.getInput('delta'))
    const githubClient = github.getOctokit(githubToken)
    const prNumber = github.context.issue.number
    const branchNameBase = github.context.payload.pull_request?.base.ref
    const branchNameHead = github.context.payload.pull_request?.head.ref
    const clientParams = {
      repo: repoName,
      owner: repoOwner,
      issue_number: prNumber
    }
    console.log(`Current branch: ${branchNameHead}.`)
    console.log(commandToRun)
    safeExec(commandToRun)
    const codeCoverageNew = <CoverageReport>(
      JSON.parse(fs.readFileSync('coverage-summary.json').toString())
    )
    console.log('Fetching...')
    safeExec('/usr/bin/git fetch')
    console.log('Stashing...')
    safeExec('/usr/bin/git stash')
    console.log(`Checking out ${branchNameBase}.`)
    safeExec(`/usr/bin/git checkout --progress --force ${branchNameBase}`)
    if (commandAfterSwitch) {
      safeExec(commandAfterSwitch)
    }
    console.log(commandToRun)
    safeExec(commandToRun)
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
    let messageToPost = `## :x: Test coverage decrease
Code coverage diff between base branch:\`${branchNameBase}\` and head branch: \`${branchNameHead}\`
Current PR reduces the test coverage percentage \n\n`
    const coverageDetails = diffChecker.getCoverageDetails(
      !fullCoverage,
      `${currentDirectory}/`
    )
    if (coverageDetails.length !== 0) {
      messageToPost +=
        'Status | File | % Stmts | % Branch | % Funcs | % Lines \n -----|-----|---------|----------|---------|------ \n'
      messageToPost += coverageDetails.join('\n')
    }
    console.log(`Message to post: ${messageToPost}`)
    console.log(`Checking if coverage has gone down by more than ${delta}%`)
    if (diffChecker.checkIfTestCoverageFallsBelowDelta(delta)) {
      console.log('Coverage Down. Creating comment and adding label.')
      await githubClient.issues.createComment({
        ...clientParams,
        body: messageToPost
      })
      await githubClient.issues.addLabels({
        ...clientParams,
        labels: [coverageLabel]
      })
    } else {
      console.log('Coverage did not go down.')
      const labels = await githubClient.issues.listLabelsOnIssue(clientParams)

      if (labels.data.map(l => l.name).includes(coverageLabel)) {
        console.log(
          `Label ${coverageLabel} found. Commenting and removing label.`
        )
        await githubClient.issues.createComment({
          ...clientParams,
          body: `## :white_check_mark: Test coverage decrease undone`
        })
        await githubClient.issues.removeLabel({
          ...clientParams,
          name: coverageLabel
        })
      } else {
        console.log(`Label ${coverageLabel} not found. Doing nothing.`)
      }
    }
  } catch (error) {
    core.setFailed(error as Error)
  }
}

run()
