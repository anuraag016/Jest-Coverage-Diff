import {CoverageReport} from './Model/CoverageReport'
import {DiffCoverageReport} from './Model/DiffCoverageReport'
import {CoverageData} from './Model/CoverageData'
import {DiffFileCoverageData} from './Model/DiffFileCoverageData'

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
              this.diffCoverageReport[key].statements
            } | ${this.diffCoverageReport[key].branches} | ${
              this.diffCoverageReport[key].functions
            } | ${this.diffCoverageReport[key].lines}`
          )
        }
      }
    }
    return returnStrings
  }

  private createDiffLine(
    name: string,
    diffFileCoverageData: DiffFileCoverageData
  ): string {
    if (!diffFileCoverageData.branches.oldPct) {
      return `**${name}** | **${diffFileCoverageData.statements.newPct}** | **${diffFileCoverageData.branches.newPct}** | **${diffFileCoverageData.functions.newPct}** | **${diffFileCoverageData.lines.newPct}**`
    } else if (!diffFileCoverageData.branches.newPct) {
      return `~~${name}~~ | ~~${diffFileCoverageData.statements.oldPct}~~ | ~~${diffFileCoverageData.branches.oldPct}~~ | ~~${diffFileCoverageData.functions.oldPct}~~ | ~~${diffFileCoverageData.lines.oldPct}~~`
    }
    return `${name} | ~~${diffFileCoverageData.statements.oldPct}~~ **${diffFileCoverageData.statements.newPct}** | ~~${diffFileCoverageData.branches.oldPct}~~ **${diffFileCoverageData.branches.newPct}** | ~~${diffFileCoverageData.functions.oldPct}~~ **${diffFileCoverageData.functions.newPct}** | ~~${diffFileCoverageData.lines.oldPct}~~ **${diffFileCoverageData.lines.newPct}**`
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
}
