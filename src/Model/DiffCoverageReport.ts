import { DiffFileCoverageData } from "./DiffFileCoverageData";

export interface DiffCoverageReport {
  [filePath: string]: DiffFileCoverageData
}