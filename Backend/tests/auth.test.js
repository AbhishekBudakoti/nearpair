const request = require("supertest");
const app = require("../app");
const db = require("./helpers/db");
const User = require("../models/user.model");

beforeAll(async () => {
    await db.connect();
});

afterEach(async () => {
    await db.clearDatabase();
});

afterAll(async () => {
    await db.closeDatabase();
});

describe("POST /api/auth/register", () => {
    it("creates a new user and never returns the password", async () => {
        const res = await request(app).post("/api/auth/register").send({
            name: "Alice",
            email: "alice@example.com",
            password: "Password123!",
        });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.user.email).toBe("alice@example.com");
        expect(res.body.data.user.password).toBeUndefined();

        const stored = await User.findOne({ email: "alice@example.com" });
        expect(stored.password).not.toBe("Password123!");
    });

    it("rejects a missing field with 400", async () => {
        const res = await request(app).post("/api/auth/register").send({
            name: "Alice",
            email: "alice@example.com",
        });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it("rejects a weak password with 400", async () => {
        const res = await request(app).post("/api/auth/register").send({
            name: "Alice",
            email: "weak-password@example.com",
            password: "password123",
        });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it("rejects a duplicate email with 409", async () => {
        await request(app).post("/api/auth/register").send({
            name: "Alice",
            email: "dupe@example.com",
            password: "Password123!",
        });

        const res = await request(app).post("/api/auth/register").send({
            name: "Alice Again",
            email: "dupe@example.com",
            password: "Password123!",
        });

        expect(res.status).toBe(409);
    });

    it("does not crash on a NoSQL-injection-shaped body", async () => {
        const res = await request(app)
            .post("/api/auth/register")
            .send({ name: "Bad", email: { $ne: null }, password: { $gt: "" } });

        // The sanitizer strips the $-operators to {}; the controller's type
        // guard then rejects the empty object cleanly instead of a 500.
        expect(res.status).toBe(400);
    });
});

describe("POST /api/auth/login", () => {
    const credentials = { name: "Bob", email: "bob@example.com", password: "Password123!" };

    beforeEach(async () => {
        await request(app).post("/api/auth/register").send(credentials);
    });

    it("logs in with correct credentials and sets an httpOnly cookie", async () => {
        const res = await request(app).post("/api/auth/login").send({
            email: credentials.email,
            password: credentials.password,
        });

        expect(res.status).toBe(200);
        expect(res.body.data.user.email).toBe(credentials.email);
        expect(res.headers["set-cookie"][0]).toMatch(/token=/);
        expect(res.headers["set-cookie"][0]).toMatch(/HttpOnly/i);
    });

    it("rejects a wrong password with 400", async () => {
        const res = await request(app).post("/api/auth/login").send({
            email: credentials.email,
            password: "wrong-password",
        });

        expect(res.status).toBe(400);
    });

    it("rejects an unknown email with 400", async () => {
        const res = await request(app).post("/api/auth/login").send({
            email: "nobody@example.com",
            password: "Password123!",
        });

        expect(res.status).toBe(400);
    });

    it("blocks login for a suspended user", async () => {
        await User.updateOne(
            { email: credentials.email },
            { $set: { isSuspended: true, suspendedUntil: null, suspensionReason: "Testing" } }
        );

        const res = await request(app).post("/api/auth/login").send({
            email: credentials.email,
            password: credentials.password,
        });

        expect(res.status).toBe(403);
        expect(res.body.code).toBe("ACCOUNT_SUSPENDED");
    });
});

describe("GET /api/auth/me", () => {
    it("requires authentication", async () => {
        const res = await request(app).get("/api/auth/me");
        expect(res.status).toBe(401);
    });

    it("returns the logged-in user for a valid session cookie", async () => {
        const agent = request.agent(app);
        await agent.post("/api/auth/register").send({
            name: "Carol",
            email: "carol@example.com",
            password: "Password123!",
        });
        await agent.post("/api/auth/login").send({
            email: "carol@example.com",
            password: "Password123!",
        });

        const res = await agent.get("/api/auth/me");

        expect(res.status).toBe(200);
        expect(res.body.data.user.email).toBe("carol@example.com");
    });
});

describe("POST /api/auth/logout", () => {
    it("clears the auth cookie", async () => {
        const res = await request(app).post("/api/auth/logout");
        expect(res.status).toBe(200);
        expect(res.headers["set-cookie"][0]).toMatch(/token=;/);
    });
});
