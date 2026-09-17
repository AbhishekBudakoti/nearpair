// Jest (on this Node version) cannot `require()` the real `cookie` package
// because v2 ships ESM-only. Every consumer Jest's module graph touches
// (Express's res.cookie, cookie-parser, engine.io, and our own
// socket/socket.js) needs the classic CJS `cookie` API, so this test-only
// shim re-exports a real, CJS-compatible build of the same package (aliased
// as devDependency "cookie-legacy") under both the classic names
// (parse/serialize) and the v2 names (parseCookie/stringifyCookie) that
// socket/socket.js imports. Test-only — production still uses the real
// top-level `cookie` package via jest.config.js's moduleNameMapper being
// absent from the actual app runtime.
const real = require("cookie-legacy");

module.exports = {
    ...real,
    parseCookie: real.parse,
    stringifyCookie: real.serialize,
};
