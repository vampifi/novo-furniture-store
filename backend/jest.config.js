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
        },
      },
    ],
  },
  testMatch: ["<rootDir>/src/**/__tests__/**/*.test.ts"],
  testPathIgnorePatterns: ["/node_modules/", "<rootDir>/.medusa/"],
  moduleFileExtensions: ["ts", "js", "json"],
  clearMocks: true,
  watchman: false,
}
