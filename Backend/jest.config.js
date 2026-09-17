module.exports = {
    testEnvironment: "node",
    setupFiles: ["<rootDir>/tests/setupEnv.js"],
    testTimeout: 15000,
    testPathIgnorePatterns: ["/node_modules/"],
    // The real `cookie` package (v2) is ESM-only; Jest can't require() it on
    // this Node version. See tests/mocks/cookie.js for why.
    moduleNameMapper: {
        "^cookie$": "<rootDir>/tests/mocks/cookie.js",
    },
};
