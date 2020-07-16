import {CoverageData} from './CoverageData'

export interface FileCoverageData {
  statements: CoverageData
  branches: CoverageData
  functions: CoverageData
  lines: CoverageData
}
