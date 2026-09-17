// Recursively strips keys that could be interpreted as Mongo query operators
// (`$gt`, `$ne`, ...) or dotted paths from a JSON request body, so a crafted
// payload can't reshape a Mongoose filter built from `req.body` fields.
const sanitizeValue = (value) => {
    if (Array.isArray(value)) {
        return value.map(sanitizeValue);
    }

    if (value && typeof value === "object" && !(value instanceof Date)) {
        const cleaned = {};
        for (const [key, val] of Object.entries(value)) {
            if (key.startsWith("$") || key.includes(".")) {
                continue;
            }
            cleaned[key] = sanitizeValue(val);
        }
        return cleaned;
    }

    return value;
};

const sanitizeBody = (req, res, next) => {
    if (req.body && typeof req.body === "object") {
        req.body = sanitizeValue(req.body);
    }
    next();
};

module.exports = sanitizeBody;
