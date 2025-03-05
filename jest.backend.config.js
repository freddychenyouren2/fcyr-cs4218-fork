export default {
  // display name
  displayName: "backend",

  // when testing backend
  testEnvironment: "node",

  moduleNameMapper: {
    "^jsonwebtoken$": "<rootDir>/mocks/jsonwebtoken.js",
  },

  setupFilesAfterEnv: ["<rootDir>/jest.setup.backend.js"],
  // which test to run
  testMatch: ["<rootDir>/controllers/*.test.js", "<rootDir>/models/*.test.js"],

  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: ["controllers/**", "models/**"],
  coverageThreshold: {
    global: {
      lines: 100,
      functions: 100,
    },
  },
};
