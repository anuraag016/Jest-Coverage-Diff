import {CoverageParser} from './CoverageParser'
import {CoveragePercentages} from './Model/CoveragePercentage'

export class CoverageDiffChecker {
  exclusiveFileSet: Set<string>
  oldCoverage: CoverageParser
  newCoverage: CoverageParser
  constructor(oldCoverage: CoverageParser, newCoverage: CoverageParser) {
    this.oldCoverage = oldCoverage
    this.newCoverage = newCoverage
    const oldMinusNew = this.setDifference(
      oldCoverage.coverageFileNames,
      newCoverage.coverageFileNames
    )
    const newMinusOld = this.setDifference(
      newCoverage.coverageFileNames,
      oldCoverage.coverageFileNames
    )
    this.exclusiveFileSet = this.setUnion(oldMinusNew, newMinusOld)
  }

  private setDifference<T>(setA: Set<T>, setB: Set<T>): Set<T> {
    return new Set([...setA].filter(x => !setB.has(x)))
  }

  private setUnion<T>(setA: Set<T>, setB: Set<T>): Set<T> {
    return new Set([...setA, ...setB])
  }

  getOnlyDiffLines(): string[] {
    return this.diffChecker(false)
  }

  getFullCoverageWithDiff(): string[] {
    return this.diffChecker(true)
  }

  private diffChecker(full: boolean): string[] {
    const lenNew = this.newCoverage.coveragePercentages.length
    const lenOld = this.oldCoverage.coveragePercentages.length
    const linesToReturn: string[] = []
    let indexNew = 0,
      indexOld = 0
    while (indexNew < lenNew || indexOld < lenOld) {
      const coveragePercentageOld = this.oldCoverage.coveragePercentages[
        indexOld
      ]
      const coveragePercentageNew = this.newCoverage.coveragePercentages[
        indexNew
      ]
      if (
        this.exclusiveFileSet.has(coveragePercentageOld.fileName.trimRight())
      ) {
        linesToReturn.push(
          `~~${this.createUnchangedCoverageLine(coveragePercentageOld)}~~`
        )
        indexOld++
      } else if (
        this.exclusiveFileSet.has(coveragePercentageNew.fileName.trimRight())
      ) {
        linesToReturn.push(
          `**${this.createUnchangedCoverageLine(coveragePercentageNew)}**`
        )
        indexNew++
      } else if (
        coveragePercentageNew.fileName.localeCompare(
          coveragePercentageOld.fileName
        )
      ) {
        indexOld++
        indexNew++
        if (
          this.compareCoverageNumber(
            coveragePercentageOld,
            coveragePercentageNew
          ) !== 0
        ) {
          const statementsLine = this.getDiffLineFromNumbers(
            coveragePercentageOld.statements,
            coveragePercentageNew.statements
          )
          const branchLine = this.getDiffLineFromNumbers(
            coveragePercentageOld.branch,
            coveragePercentageNew.branch
          )
          const funcLine = this.getDiffLineFromNumbers(
            coveragePercentageOld.func,
            coveragePercentageNew.func
          )
          const linesLine = this.getDiffLineFromNumbers(
            coveragePercentageOld.lines,
            coveragePercentageNew.lines
          )
          const uncoveredLinesLine = this.getDiffLine(
            coveragePercentageOld.uncoveredLines,
            coveragePercentageNew.uncoveredLines
          )
          const lineToAdd = `${coveragePercentageNew.fileName
            .trimRight()
            .replace(
              / /g,
              '&nbsp;&nbsp;'
            )}| ${statementsLine} | ${branchLine} | ${funcLine} | ${linesLine} | ${uncoveredLinesLine} \n`
          linesToReturn.push(lineToAdd)
        } else if (full) {
          linesToReturn.push(
            this.createUnchangedCoverageLine(coveragePercentageNew)
          )
        }
      }
    }
    return linesToReturn
  }

  private createUnchangedCoverageLine(
    coveragePercentage: CoveragePercentages
  ): string {
    return `${coveragePercentage.fileName} | ${coveragePercentage.statements} | ${coveragePercentage.branch} | ${coveragePercentage.func} | ${coveragePercentage.lines} | ${coveragePercentage.uncoveredLines}`
  }

  private compareCoverageNumber(
    prevPercentage: CoveragePercentages,
    newPercentage: CoveragePercentages
  ): number {
    if (
      prevPercentage.statements !== newPercentage.statements ||
      prevPercentage.branch !== newPercentage.branch ||
      prevPercentage.func !== newPercentage.func ||
      prevPercentage.lines !== newPercentage.lines ||
      prevPercentage.uncoveredLines.localeCompare(
        newPercentage.uncoveredLines
      ) !== 0
    ) {
      return 1
    }
    return 0
  }

  private getDiffLineFromNumbers(prevVal: number, newVal: number): string {
    if (prevVal !== newVal) {
      return `~~${prevVal}~~ **${newVal}**`
    }
    return `${newVal}`
  }

  private getDiffLine(prevLine: string, newLine: string): string {
    if (prevLine.localeCompare(newLine) !== 0) {
      if (prevLine === '') {
        return `**${newLine}**`
      } else if (newLine === '') {
        return `~~${prevLine}~~`
      }
      return `~~${prevLine}~~ **${newLine}**`
    }
    return `${newLine}`
  }
}
