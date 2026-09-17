// Runs before the test framework and any test file is loaded, so these env
// vars are already set when app.js/controllers read them.
process.env.NODE_ENV = "test";
process.env.MONGO_URL = "mongodb://127.0.0.1:27017/find_a_partner_test";
process.env.JWT_SECRET = "test-jwt-secret";
process.env.JWT_EXPIRES_IN = "1h";
process.env.CLIENT_URL = "http://localhost:5173";
