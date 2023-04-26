import {DiffChecker} from '../src/DiffChecker'

describe('DiffChecker', () => {
  const mock100Coverage = {
    total: 100,
    covered: 100,
    skipped: 0,
    pct: 100
  }
  const mock99Coverage = {
    total: 100,
    covered: 99,
    skipped: 1,
    pct: 99
  }
  const mock98Coverage = {
    total: 100,
    covered: 98,
    skipped: 1,
    pct: 98
  }
  const mockEmptyCoverage = {
    total: 100,
    covered: 0,
    skipped: 100,
    pct: 0
  }
  const mock99CoverageFile = {
    statements: mock99Coverage,
    branches: mock99Coverage,
    functions: mock99Coverage,
    lines: mock99Coverage
  }
  const mock100CoverageFile = {
    statements: mock100Coverage,
    branches: mock100Coverage,
    functions: mock100Coverage,
    lines: mock100Coverage
  }
  const mock98CoverageFile = {
    statements: mock98Coverage,
    branches: mock98Coverage,
    functions: mock98Coverage,
    lines: mock98Coverage
  }
  const mockEmptyCoverageFile = {
    statements: mockEmptyCoverage,
    branches: mockEmptyCoverage,
    functions: mockEmptyCoverage,
    lines: mockEmptyCoverage
  }
  it('generates the correct diff', () => {
    const codeCoverageOld = {
      file1: mock99CoverageFile,
      file2: mock100CoverageFile,
      file4: mock100CoverageFile,
      file5: mock99CoverageFile
    }
    const codeCoverageNew = {
      file1: mock100CoverageFile,
      file2: mock99CoverageFile,
      file3: mock100CoverageFile,
      file5: {
        statements: mock99Coverage,
        branches: mockEmptyCoverage,
        functions: mock99Coverage,
        lines: mock99Coverage
      }
    }
    const diffChecker = new DiffChecker(codeCoverageNew, codeCoverageOld)
    const details = diffChecker.getCoverageDetails(false, '')
    expect(details).toStrictEqual([
      ' :green_circle: | file1 | 100 **(1)** | 100 **(1)** | 100 **(1)** | 100 **(1)**',
      ' :red_circle: | file2 | 99 **(-1)** | 99 **(-1)** | 99 **(-1)** | 99 **(-1)**',
      ' :sparkles: :new: | **file3** | **100** | **100** | **100** | **100**',
      ' :red_circle: | file5 | 99 **(0)** | 0 **(-99)** | 99 **(0)** | 99 **(0)**',
      ' :x: | ~~file4~~ | ~~100~~ | ~~100~~ | ~~100~~ | ~~100~~'
    ])
  })
  describe('testing checkIfTestCoverageFallsBelowDelta', () => {
    describe('respects total_delta for total and delta for other files', () => {
      it('returns true because delta diff is too high, even if total_delta is okay', () => {
        const codeCoverageOld = {
          total: mock100CoverageFile,
          file1: mock100CoverageFile
        }
        const codeCoverageNew = {
          total: mock98CoverageFile,
          file1: mock98CoverageFile
        }
        const diffChecker = new DiffChecker(codeCoverageNew, codeCoverageOld)
        const isTestCoverageFallsBelowDelta = diffChecker.checkIfTestCoverageFallsBelowDelta(
          1,
          50
        )
        expect(isTestCoverageFallsBelowDelta).toBeTruthy()
      })
      it('returns true because total_delta diff is too high, even if delta is okay', () => {
        const codeCoverageOld = {
          total: mock100CoverageFile,
          file1: mock100CoverageFile
        }
        const codeCoverageNew = {
          total: mock98CoverageFile,
          file1: mock98CoverageFile
        }
        const diffChecker = new DiffChecker(codeCoverageNew, codeCoverageOld)
        const isTestCoverageFallsBelowDelta = diffChecker.checkIfTestCoverageFallsBelowDelta(
          50,
          1
        )
        expect(isTestCoverageFallsBelowDelta).toBeTruthy()
      })
      it('returns true if delta diff is too high - total_delta is not defined', () => {
        const codeCoverageOld = {
          total: mock100CoverageFile,
          file1: mock100CoverageFile
        }
        const codeCoverageNew = {
          total: mock98CoverageFile,
          file1: mock98CoverageFile
        }
        const diffChecker = new DiffChecker(codeCoverageNew, codeCoverageOld)
        const isTestCoverageFallsBelowDelta = diffChecker.checkIfTestCoverageFallsBelowDelta(
          1,
          null
        )
        expect(isTestCoverageFallsBelowDelta).toBeTruthy()
      })
      it('returns false if total_delta and delta are okay', () => {
        const codeCoverageOld = {
          total: mock100CoverageFile,
          file1: mock100CoverageFile
        }
        const codeCoverageNew = {
          total: mock98CoverageFile,
          file1: mock98CoverageFile
        }
        const diffChecker = new DiffChecker(codeCoverageNew, codeCoverageOld)
        const isTestCoverageFallsBelowDelta = diffChecker.checkIfTestCoverageFallsBelowDelta(
          50,
          50
        )
        expect(isTestCoverageFallsBelowDelta).toBeFalsy()
      })
      it('returns false if delta is okay - total_delta is not defined', () => {
        const codeCoverageOld = {
          total: mock100CoverageFile,
          file1: mock100CoverageFile
        }
        const codeCoverageNew = {
          total: mock98CoverageFile,
          file1: mock98CoverageFile
        }
        const diffChecker = new DiffChecker(codeCoverageNew, codeCoverageOld)
        const isTestCoverageFallsBelowDelta = diffChecker.checkIfTestCoverageFallsBelowDelta(
          50,
          null
        )
        expect(isTestCoverageFallsBelowDelta).toBeFalsy()
      })
    })
    it('detects that total coverage dropped below total_delta', () => {
      const codeCoverageOld = {
        total: mock100CoverageFile
      }
      const codeCoverageNew = {
        total: mock98CoverageFile
      }
      const diffChecker = new DiffChecker(codeCoverageNew, codeCoverageOld)
      const isTestCoverageFallsBelowDelta = diffChecker.checkIfTestCoverageFallsBelowDelta(
        2,
        1
      )
      expect(isTestCoverageFallsBelowDelta).toBeTruthy()
    })
    it('detects that total coverage did not drop below total_delta', () => {
      const codeCoverageOld = {
        total: mock100CoverageFile
      }
      const codeCoverageNew = {
        total: mock98CoverageFile
      }
      const diffChecker = new DiffChecker(codeCoverageNew, codeCoverageOld)
      const isTestCoverageFallsBelowDelta = diffChecker.checkIfTestCoverageFallsBelowDelta(
        1,
        5
      )
      expect(isTestCoverageFallsBelowDelta).toBeFalsy()
    })
    it('detects that total coverage dropped below delta', () => {
      const codeCoverageOld = {
        total: mock100CoverageFile
      }
      const codeCoverageNew = {
        total: mock98CoverageFile
      }
      const diffChecker = new DiffChecker(codeCoverageNew, codeCoverageOld)
      const isTestCoverageFallsBelowDelta = diffChecker.checkIfTestCoverageFallsBelowDelta(
        1,
        null
      )
      expect(isTestCoverageFallsBelowDelta).toBeTruthy()
    })
    it('detects that total coverage did not drop below delta', () => {
      const codeCoverageOld = {
        total: mock100CoverageFile
      }
      const codeCoverageNew = {
        total: mock98CoverageFile
      }
      const diffChecker = new DiffChecker(codeCoverageNew, codeCoverageOld)
      const isTestCoverageFallsBelowDelta = diffChecker.checkIfTestCoverageFallsBelowDelta(
        2,
        null
      )
      expect(isTestCoverageFallsBelowDelta).toBeFalsy()
    })
  })
})
