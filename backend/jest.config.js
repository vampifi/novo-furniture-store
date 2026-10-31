/** @type {import('jest').Config} */
module.exports = {
  rootDir: ".",
  testEnvironment: "node",
  transform: {
    "^.+\\.(t|j)sx?$": [
      "@swc/jest",
      {
        jsc: {
          target: "es2019",
          parser: { syntax: "typescript", decorators: true },
          transform: {
            legacyDecorator: true,
            decoratorMetadata: true,
          },
        },
      },
    ],
  },
  // Issue #12 (google-sheets) landed first and established *.test.ts; issue #11
  // (product-catalog-sync) was built in parallel using *.spec.ts. Both conventions are
  // supported here rather than forcing a rename of either ticket's already-reviewed tests.
  testMatch: ["<rootDir>/src/**/__tests__/**/*.test.ts", "<rootDir>/src/**/__tests__/**/*.spec.ts"],
  testPathIgnorePatterns: ["/node_modules/", "<rootDir>/.medusa/"],
  moduleFileExtensions: ["ts", "js", "json"],
  clearMocks: true,
  watchman: false,
}
