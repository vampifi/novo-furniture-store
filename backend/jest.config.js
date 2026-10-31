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
          // `tsx: true` is safe for plain .ts files too (no JSX in them to misparse) and is
          // required to parse the .tsx React-email templates that Medusa's own subscriber
          // loader pulls in transitively (issue #14's integration tests boot the *whole* app,
          // not just this ticket's code, so every subscriber in src/subscribers must resolve).
          parser: { syntax: "typescript", tsx: true, decorators: true },
          transform: {
            legacyDecorator: true,
            decoratorMetadata: true,
            // Matches tsconfig.json's `jsx: "react-jsx"` (automatic runtime, no manual React import).
            react: { runtime: "automatic" },
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
  // "tsx" added for issue #14: see the transform comment above.
  moduleFileExtensions: ["ts", "tsx", "js", "json"],
  // Mirrors tsconfig.json's `baseUrl: "."` + `paths: { "*": ["./src/*"] }` for Jest's own resolver -
  // needed because medusa-config.js (and modules it imports, e.g. `lib/constants`) use bare
  // specifiers resolved that way, and @medusajs/test-utils loads medusa-config.js through Jest's
  // module system (issue #14's integration tests) rather than Medusa's own CLI loader.
  modulePaths: ["<rootDir>/src"],
  clearMocks: true,
  watchman: false,
  // Issue #14: first integration tests in this repo (@medusajs/test-utils' medusaIntegrationTestRunner,
  // which boots a real Medusa app). See jest.integration.setup.js for why this must be `setupFiles`
  // (runs before any test file's own imports) rather than a `.env.test` file.
  setupFiles: ["<rootDir>/jest.integration.setup.js"],
}
