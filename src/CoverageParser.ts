import {CoveragePercentages} from './Model/CoveragePercentage'

export class CoverageParser {
  coveragePercentages: CoveragePercentages[] = []
  headerLines: string[] = []
  coverageFileNames: Set<string> = new Set<string>()

  constructor(coverageReport: string) {
    const coverageReportParts = coverageReport.split('\n')
    const breakCoverageReport = coverageReportParts.slice(
      3,
      coverageReportParts.length - 1
    )
    // eslint-disable-next-line github/array-foreach
    breakCoverageReport.forEach(coverageLine => {
      const components = coverageLine.split('|')
      const coveragePercentage: CoveragePercentages = {
        fileName: components[0],
        statements: parseFloat(components[1]),
        branch: parseFloat(components[2]),
        func: parseFloat(components[3]),
        lines: parseFloat(components[4]),
        uncoveredLines: components[5] ? components[5].trim() : ''
      }
      this.coveragePercentages.push(coveragePercentage)
      this.coverageFileNames.add(components[0].trimRight())
    })
    this.headerLines = coverageReportParts.slice(0, 3)
  }
}
