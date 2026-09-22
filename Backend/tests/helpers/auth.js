const request = require("supertest");
const app = require("../../app");

let counter = 0;

/**
 * Registers and logs in a fresh user, returning a supertest agent that
 * carries the httpOnly auth cookie on every subsequent request, plus the
 * user object the API returned.
 */
const registerAndLogin = async (overrides = {}) => {
    counter += 1;
    const email = overrides.email || `user${counter}_${Date.now()}@example.com`;
    const password = overrides.password || "Password123!";
    const name = overrides.name || `Test User ${counter}`;

    const agent = request.agent(app);

    await agent.post("/api/auth/register").send({ name, email, password });
    const loginRes = await agent.post("/api/auth/login").send({ email, password });

    return { agent, user: loginRes.body.data.user, email, password };
};

module.exports = { registerAndLogin };
