const rateLimit = require("express-rate-limit");

const WINDOW_MS = 15 * 60 * 1000;

// General API traffic.
const apiLimiter = rateLimit({
    windowMs: WINDOW_MS,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests, please try again later",
    },
});

// Login/register are brute-force / credential-stuffing targets, so they get a
// much stricter limit than the rest of the API.
const authLimiter = rateLimit({
    windowMs: WINDOW_MS,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: {
        success: false,
        message: "Too many attempts, please try again later",
    },
});

module.exports = { apiLimiter, authLimiter };
