const request = require("supertest");
const app = require("../app");
const db = require("./helpers/db");
const { registerAndLogin } = require("./helpers/auth");
const Match = require("../models/match.model");

beforeAll(async () => {
    await db.connect();
});

afterEach(async () => {
    await db.clearDatabase();
});

afterAll(async () => {
    await db.closeDatabase();
});

describe("Partner request lifecycle", () => {
    it("requires authentication to create a request", async () => {
        const res = await request(app).post("/api/requests").send({ recipient: "507f1f77bcf86cd799439011" });
        expect(res.status).toBe(401);
    });

    it("rejects sending a request to yourself", async () => {
        const { agent, user } = await registerAndLogin();

        const res = await agent.post("/api/requests").send({ recipient: user.id });

        expect(res.status).toBe(400);
    });

    it("rejects an invalid recipient id", async () => {
        const { agent } = await registerAndLogin();

        const res = await agent.post("/api/requests").send({ recipient: "not-an-id" });

        expect(res.status).toBe(400);
    });

    it("rejects a duplicate pending request to the same recipient", async () => {
        const { agent: sender } = await registerAndLogin();
        const { user: recipient } = await registerAndLogin();

        await sender.post("/api/requests").send({ recipient: recipient.id });
        const res = await sender.post("/api/requests").send({ recipient: recipient.id });

        expect(res.status).toBe(409);
    });

    it("lets the recipient accept a request, creating an active Match", async () => {
        const { agent: sender, user: senderUser } = await registerAndLogin();
        const { agent: recipientAgent, user: recipient } = await registerAndLogin();

        const createRes = await sender.post("/api/requests").send({ recipient: recipient.id });
        expect(createRes.status).toBe(201);
        const requestId = createRes.body.data.request._id;

        const acceptRes = await recipientAgent.patch(`/api/requests/${requestId}/accept`);

        expect(acceptRes.status).toBe(200);
        expect(acceptRes.body.data.request.status).toBe("accepted");
        expect(acceptRes.body.data.match.status).toBe("active");

        const match = await Match.findById(acceptRes.body.data.match._id);
        expect(match.users.map(String).sort()).toEqual(
            [senderUser.id, recipient.id].sort()
        );
    });

    it("lets the recipient reject a request", async () => {
        const { agent: sender, user: senderUser } = await registerAndLogin();
        const { agent: recipientAgent, user: recipient } = await registerAndLogin();
        void senderUser;

        const createRes = await sender.post("/api/requests").send({ recipient: recipient.id });
        const requestId = createRes.body.data.request._id;

        const rejectRes = await recipientAgent.patch(`/api/requests/${requestId}/reject`);

        expect(rejectRes.status).toBe(200);
        expect(rejectRes.body.data.request.status).toBe("rejected");
    });

    it("prevents the sender from accepting their own sent request", async () => {
        const { agent: sender } = await registerAndLogin();
        const { user: recipient } = await registerAndLogin();

        const createRes = await sender.post("/api/requests").send({ recipient: recipient.id });
        const requestId = createRes.body.data.request._id;

        const res = await sender.patch(`/api/requests/${requestId}/accept`);

        expect(res.status).toBe(404);
    });

    it("lets the sender cancel their own pending request", async () => {
        const { agent: sender } = await registerAndLogin();
        const { user: recipient } = await registerAndLogin();

        const createRes = await sender.post("/api/requests").send({ recipient: recipient.id });
        const requestId = createRes.body.data.request._id;

        const cancelRes = await sender.delete(`/api/requests/${requestId}`);

        expect(cancelRes.status).toBe(200);
        expect(cancelRes.body.data.request.status).toBe("cancelled");
    });

    it("lists requests involving the current user", async () => {
        const { agent: sender } = await registerAndLogin();
        const { agent: recipientAgent, user: recipient } = await registerAndLogin();

        await sender.post("/api/requests").send({ recipient: recipient.id });

        const res = await recipientAgent.get("/api/requests");

        expect(res.status).toBe(200);
        expect(res.body.data.requests).toHaveLength(1);
    });
});
