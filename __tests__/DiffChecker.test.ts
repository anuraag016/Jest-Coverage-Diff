import { DiffChecker } from "../src/DiffChecker";

describe("DiffChecker", () => {
  const mock100Coverage = {
    total: 100,
    covered: 100,
    skipped: 0,
    pct: 100,
  }
  const mock99Coverage = {
    total: 100,
    covered: 99,
    skipped: 1,
    pct: 99,
  }
  const mockEmptyCoverage = {
    total: 100,
    covered: 0,
    skipped: 100,
    pct: 0,
  }
  const mock99CoverageFile = {
    statements: mock99Coverage,
    branches: mock99Coverage,
    functions: mock99Coverage,
    lines: mock99Coverage,
  };
  const mock100CoverageFile = {
    statements: mock100Coverage,
    branches: mock100Coverage,
    functions: mock100Coverage,
    lines: mock100Coverage,
  }
  const mockEmptyCoverageFile = {
    statements: mockEmptyCoverage,
    branches: mockEmptyCoverage,
    functions: mockEmptyCoverage,
    lines: mockEmptyCoverage,
  }
  it("generates the correct diff", () => {
    const codeCoverageOld = {
      file1: mock99CoverageFile,
      file2: mock100CoverageFile,
      file3: mockEmptyCoverageFile,
      file4: mock100CoverageFile,
      file5: mock99CoverageFile,
    };
    const codeCoverageNew = {
      file1: mock100CoverageFile,
      file2: mock99CoverageFile,
      file3: mock100CoverageFile,
      file4: mockEmptyCoverageFile,
      file5: {
        statements: mock99Coverage,
        branches: mockEmptyCoverage,
        functions: mock99Coverage,
        lines: mock99Coverage,
      },
    };
    const diffChecker = new DiffChecker(codeCoverageNew, codeCoverageOld);
    const details =  diffChecker.getCoverageDetails(false, "")
    expect(details).toStrictEqual([
      " :green_circle: | file1 | 100 **(1)** | 100 **(1)** | 100 **(1)** | 100 **(1)**",
      " :red_circle: | file2 | 99 **(-1)** | 99 **(-1)** | 99 **(-1)** | 99 **(-1)**",
      " :sparkles: :new: | **file3** | **100** | **100** | **100** | **100**",
      " :x: | ~~file4~~ | ~~100~~ | ~~100~~ | ~~100~~ | ~~100~~",
      " :red_circle: | file5 | 99 **(0)** | 0 **(-99)** | 99 **(0)** | 99 **(0)**",
    ])
  });
});