const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

const apiRoutes = require("./routes");
const notFound = require("./middlewares/notFound.middleware");
const errorHandler = require("./middlewares/error.midlleware");
const { apiLimiter, authLimiter } = require("./middlewares/rateLimit.middleware");
const sanitizeBody = require("./middlewares/sanitizeBody.middleware");

/**
 * Express Application initialization and middleware pipeline setup.
 */
const app = express();

// --- SECURITY HEADERS ---
app.use(helmet());

// --- CORS CONFIGURATION ---
app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        credentials: true,
    })
);

// --- RATE LIMITING ---
// Tighter limit on auth endpoints (brute force / credential stuffing), looser
// limit on the rest of the API.
app.use("/api/auth", authLimiter);
app.use("/api", apiLimiter);

// --- BODY PARSERS ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Express 5 leaves req.body undefined when a request carries no body, where
// Express 4 defaulted it to {}. Controllers destructure req.body directly, so
// a bodyless POST/PATCH would throw a TypeError and surface as a 500. Restore
// the empty-object default once here rather than guarding at every call site.
app.use((req, res, next) => {
    if (req.body === undefined) {
        req.body = {};
    }
    next();
});

// --- COOKIE PARSER ---
app.use(cookieParser());

// --- NOSQL INJECTION GUARD ---
// Strips `$`-operator and dotted keys from the request body so a crafted
// payload like { "email": { "$ne": null } } can't reach a Mongoose filter.
app.use(sanitizeBody);

// --- API ROUTES ---
app.use("/api", apiRoutes);

// --- 404 NOT FOUND MIDDLEWARE ---
app.use(notFound);

// --- GLOBAL ERROR HANDLER ---
app.use(errorHandler);

module.exports = app;