import {CoverageReport} from './Model/CoverageReport'
import {DiffCoverageReport} from './Model/DiffCoverageReport'
import {CoverageData} from './Model/CoverageData'
import {DiffFileCoverageData} from './Model/DiffFileCoverageData'
import {DiffCoverageData} from './Model/DiffCoverageData'

const increasedCoverageIcon = ':green_circle:'
const decreasedCoverageIcon = ':red_circle:'
const newCoverageIcon = ':new:'

export class DiffChecker {
  private diffCoverageReport: DiffCoverageReport = {}
  constructor(
    coverageReportNew: CoverageReport,
    coverageReportOld: CoverageReport
  ) {
    const reportNewKeys = Object.keys(coverageReportNew)
    for (const key of reportNewKeys) {
      this.diffCoverageReport[key] = {
        branches: {
          newPct: this.getPercentage(coverageReportNew[key].branches)
        },
        statements: {
          newPct: this.getPercentage(coverageReportNew[key].statements)
        },
        lines: {
          newPct: this.getPercentage(coverageReportNew[key].lines)
        },
        functions: {
          newPct: this.getPercentage(coverageReportNew[key].functions)
        }
      }
    }
    const reportOldKeys = Object.keys(coverageReportOld)
    for (const key of reportOldKeys) {
      if (this.diffCoverageReport[key]) {
        this.diffCoverageReport[key].statements.oldPct = this.getPercentage(
          coverageReportOld[key].statements
        )
        this.diffCoverageReport[key].branches.oldPct = this.getPercentage(
          coverageReportOld[key].branches
        )
        this.diffCoverageReport[key].functions.oldPct = this.getPercentage(
          coverageReportOld[key].functions
        )
        this.diffCoverageReport[key].lines.oldPct = this.getPercentage(
          coverageReportOld[key].lines
        )
      } else {
        this.diffCoverageReport[key] = {
          branches: {
            oldPct: this.getPercentage(coverageReportOld[key].branches)
          },
          statements: {
            oldPct: this.getPercentage(coverageReportOld[key].statements)
          },
          lines: {
            oldPct: this.getPercentage(coverageReportOld[key].lines)
          },
          functions: {
            oldPct: this.getPercentage(coverageReportOld[key].functions)
          }
        }
      }
    }
  }

  getCoverageDetails(diffOnly: boolean, currentDirectory: string): string[] {
    const keys = Object.keys(this.diffCoverageReport)
    const returnStrings: string[] = []
    for (const key of keys) {
      if (this.compareCoverageValues(this.diffCoverageReport[key]) !== 0) {
        returnStrings.push(
          this.createDiffLine(
            key.replace(currentDirectory, ''),
            this.diffCoverageReport[key]
          )
        )
      } else {
        if (!diffOnly) {
          returnStrings.push(
            `${key.replace(currentDirectory, '')} | ${
              this.diffCoverageReport[key].statements.newPct
            } | ${this.diffCoverageReport[key].branches.newPct} | ${
              this.diffCoverageReport[key].functions.newPct
            } | ${this.diffCoverageReport[key].lines.newPct}`
          )
        }
      }
    }
    return returnStrings
  }

  checkIfTestCoverageFallsBelowDelta(delta: number): boolean {
    const keys = Object.keys(this.diffCoverageReport)
    for (const key of keys) {
      const diffCoverageData = this.diffCoverageReport[key]
      const keys: ('lines' | 'statements' | 'branches' | 'functions')[] = <
        ('lines' | 'statements' | 'branches' | 'functions')[]
      >Object.keys(diffCoverageData)
      for (const key of keys) {
        if (diffCoverageData[key].oldPct !== diffCoverageData[key].newPct) {
          if (-this.getPercentageDiff(diffCoverageData[key]) > delta) {
            return true
          }
        }
      }
    }

    return false
  }

  private createDiffLine(
    name: string,
    diffFileCoverageData: DiffFileCoverageData
  ): string {
    if (!diffFileCoverageData.branches.oldPct) {
      // No old coverage found so that means we added a new file coverage
      return ` ${newCoverageIcon} | **${name}** | **${diffFileCoverageData.statements.newPct}** | **${diffFileCoverageData.branches.newPct}** | **${diffFileCoverageData.functions.newPct}** | **${diffFileCoverageData.lines.newPct}**`
    } else if (!diffFileCoverageData.branches.newPct) {
      // No new coverage found so that means we added a new deleted coverage
      return ` ${decreasedCoverageIcon} | ~~${name}~~ | ~~${diffFileCoverageData.statements.oldPct}~~ | ~~${diffFileCoverageData.branches.oldPct}~~ | ~~${diffFileCoverageData.functions.oldPct}~~ | ~~${diffFileCoverageData.lines.oldPct}~~`
    }
    // Coverage existed before so calculate the diff status
    const statusIcon = this.getStatusIcon(diffFileCoverageData)
    return ` ${statusIcon} | ${name} | ${
      diffFileCoverageData.statements.newPct
    } **(${this.getPercentageDiff(diffFileCoverageData.statements)})** | ${
      diffFileCoverageData.branches.newPct
    } **(${this.getPercentageDiff(diffFileCoverageData.branches)})** | ${
      diffFileCoverageData.functions.newPct
    } **(${this.getPercentageDiff(diffFileCoverageData.functions)})** | ${
      diffFileCoverageData.lines.newPct
    } **(${this.getPercentageDiff(diffFileCoverageData.lines)})**`
  }

  private compareCoverageValues(
    diffCoverageData: DiffFileCoverageData
  ): number {
    const keys: ('lines' | 'statements' | 'branches' | 'functions')[] = <
      ('lines' | 'statements' | 'branches' | 'functions')[]
    >Object.keys(diffCoverageData)
    for (const key of keys) {
      if (diffCoverageData[key].oldPct !== diffCoverageData[key].newPct) {
        return 1
      }
    }
    return 0
  }

  private getPercentage(coverageData: CoverageData): number {
    return coverageData.pct
  }

  private getStatusIcon(
    diffFileCoverageData: DiffFileCoverageData
  ): ':green_circle:' | ':red_circle:' {
    let overallDiff = 0
    Object.values(diffFileCoverageData).forEach(coverageData => {
      overallDiff = overallDiff + this.getPercentageDiff(coverageData)
    })
    if (overallDiff < 0) {
      return decreasedCoverageIcon
    }
    return increasedCoverageIcon
  }

  private getPercentageDiff(diffData: DiffCoverageData): number {
    // get diff
    const diff = Number(diffData.newPct) - Number(diffData.oldPct)
    // round off the diff to 2 decimal places
    return Math.round((diff + Number.EPSILON) * 100) / 100
  }
}
