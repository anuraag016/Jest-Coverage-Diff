import {DiffCoverageData} from './DiffCoverageData'

export interface DiffFileCoverageData {
  lines: DiffCoverageData
  statements: DiffCoverageData
  branches: DiffCoverageData
  functions: DiffCoverageData
}
