module.exports = {
  clearMocks: true,
  moduleFileExtensions: ['js', 'ts'],
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  testRunner: 'jest-circus/runner',
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  verbose: true,
  silent: false,
  globals: {
    'ts-jest': {
      tsConfig: './tsconfig.json',
    },
  },
  collectCoverage: true,
  coveragePathIgnorePatterns: ["<rootDir>/build/", "<rootDir>/node_modules/", "<rootDir>/__tests__", "__tests__"],
  collectCoverageFrom: [
    "src/*.ts",
    "!**/node_modules/**",
    "!**/build/**",
    "!**/dist/**"
  ]
}
