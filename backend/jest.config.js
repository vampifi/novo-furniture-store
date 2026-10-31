/**
 * Minimal Jest config for backend unit tests.
 *
 * Scope deliberately kept small: this repo has no prior Jest setup (no config, no "test"
 * script, zero test files before issue #11). This config only wires up what pure-logic unit
 * tests under src/<module>/__tests__ need - TS transform via the already-installed @swc/jest,
 * and node test environment. It intentionally does not configure @medusajs/test-utils or any
 * integration-test runner; add that separately if/when integration tests are needed.
 */
module.exports = {
  testEnvironment: "node",
  rootDir: "src",
  // This sandbox has no watchman daemon available; jest-haste-map falls back to its
  // pure-Node file crawler when this is off. Has no effect on test behavior, only on
  // how Jest discovers files.
  watchman: false,
  testMatch: ["**/__tests__/**/*.spec.ts"],
  transform: {
    "^.+\\.ts$": [
      "@swc/jest",
      {
        jsc: {
          parser: {
            syntax: "typescript",
            decorators: true,
          },
          transform: {
            legacyDecorator: true,
            decoratorMetadata: true,
          },
          target: "es2019",
        },
      },
    ],
  },
}
