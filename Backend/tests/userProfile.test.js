const request = require("supertest");
const app = require("../app");
const db = require("./helpers/db");
const { registerAndLogin } = require("./helpers/auth");
const Block = require("../models/block.model");

beforeAll(async () => {
    await db.connect();
});

afterEach(async () => {
    await db.clearDatabase();
});

afterAll(async () => {
    await db.closeDatabase();
});

describe("GET /api/profile/user/:userId", () => {
    it("requires authentication", async () => {
        const res = await request(app).get("/api/profile/user/507f1f77bcf86cd799439011");
        expect(res.status).toBe(401);
    });

    it("returns a placeholder profile, without the email, for a user who hasn't created one", async () => {
        const { agent } = await registerAndLogin();
        const { user: other } = await registerAndLogin({ name: "Other Person" });

        const res = await agent.get(`/api/profile/user/${other.id}`);

        expect(res.status).toBe(200);
        expect(res.body.data.profile.user.name).toBe("Other Person");
        expect(res.body.data.profile.user.email).toBeUndefined();
        expect(res.body.data.profile.skills).toEqual([]);
    });

    it("404s for an unknown user", async () => {
        const { agent } = await registerAndLogin();

        const res = await agent.get("/api/profile/user/507f1f77bcf86cd799439011");

        expect(res.status).toBe(404);
    });

    it("404s in both directions once either user has blocked the other", async () => {
        const { agent: blockerAgent, user: blocker } = await registerAndLogin();
        const { agent: blockedAgent, user: blocked } = await registerAndLogin();

        await Block.create({ blocker: blocker.id, blocked: blocked.id });

        const blockedView = await blockedAgent.get(`/api/profile/user/${blocker.id}`);
        const blockerView = await blockerAgent.get(`/api/profile/user/${blocked.id}`);

        expect(blockedView.status).toBe(404);
        expect(blockerView.status).toBe(404);
    });
});
