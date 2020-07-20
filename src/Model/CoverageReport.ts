import {FileCoverageData} from './FileCoverageData'

export interface CoverageReport {
  [filePath: string]: FileCoverageData
}
