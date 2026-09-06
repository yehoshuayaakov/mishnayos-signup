/** @type {import("@stryker-mutator/api/core").PartialStrykerOptions} */
const config = {
  testRunner: "vitest",
  mutate: [
    "lib/**/*.ts",
    "app/api/**/route.ts",
    "!**/*.test.ts",
    "!lib/e2e-fixture.ts",
  ],
  reporters: ["clear-text", "progress", "html", "json"],
  coverageAnalysis: "perTest",
  vitest: {
    configFile: "vitest.config.ts",
    related: true,
  },
  disableTypeChecks: "**/*.{js,jsx,ts,tsx,mjs,mts,cjs,cts}",
  thresholds: {
    high: 80,
    low: 60,
    break: 0,
  },
  concurrency: 2,
  timeoutMS: 15000,
  timeoutFactor: 1.5,
  tempDirName: ".stryker-tmp",
};

export default config;
