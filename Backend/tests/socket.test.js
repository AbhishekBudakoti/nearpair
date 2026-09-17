const http = require("http");
const { io: Client } = require("socket.io-client");
const request = require("supertest");

const app = require("../app");
const initializeSocket = require("../socket/socket");
const db = require("./helpers/db");
const Match = require("../models/match.model");
const PartnerRequest = require("../models/partnerRequest.model");

let server;
let port;

beforeAll(async () => {
    await db.connect();

    server = http.createServer(app);
    initializeSocket(server);

    await new Promise((resolve) => {
        server.listen(0, () => {
            port = server.address().port;
            resolve();
        });
    });
});

afterEach(async () => {
    await db.clearDatabase();
});

afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
    await db.closeDatabase();
});

const registerAndGetCookie = async (email) => {
    const agent = request.agent(app);
    await agent
        .post("/api/auth/register")
        .send({ name: "Socket User", email, password: "password123" });
    const res = await agent.post("/api/auth/login").send({ email, password: "password123" });
    const cookie = res.headers["set-cookie"][0].split(";")[0];
    return { cookie, user: res.body.data.user };
};

const connectClient = (cookie) =>
    new Promise((resolve, reject) => {
        const socket = Client(`http://localhost:${port}`, {
            transports: ["websocket"],
            extraHeaders: cookie ? { cookie } : undefined,
            forceNew: true,
        });
        socket.on("connect", () => resolve(socket));
        socket.on("connect_error", (err) => reject(err));
    });

describe("Socket.IO authentication", () => {
    it("rejects a connection with no auth cookie", async () => {
        await expect(connectClient(undefined)).rejects.toThrow(/Authentication required/);
    });

    it("rejects a connection with a garbage token", async () => {
        await expect(connectClient("token=not-a-real-jwt")).rejects.toThrow(/Invalid or expired token/);
    });

    it("accepts a connection with a valid session cookie", async () => {
        const { cookie } = await registerAndGetCookie("socketauth@example.com");
        const socket = await connectClient(cookie);
        expect(socket.connected).toBe(true);
        socket.close();
    });
});

describe("Socket.IO presence", () => {
    it("broadcasts presence:online to already-connected users when a new user connects", async () => {
        const { cookie: cookieA } = await registerAndGetCookie("presencea@example.com");
        const { cookie: cookieB, user: userB } = await registerAndGetCookie("presenceb@example.com");

        const socketA = await connectClient(cookieA);

        const onlineEvent = new Promise((resolve) => {
            socketA.on("presence:online", resolve);
        });

        const socketB = await connectClient(cookieB);

        const data = await onlineEvent;
        expect(data.userId).toBe(userB.id);

        socketA.close();
        socketB.close();
    });
});

describe("Socket.IO chat", () => {
    const createActiveMatch = async (userAId, userBId) => {
        const partnerRequest = await PartnerRequest.create({
            sender: userAId,
            recipient: userBId,
            status: "accepted",
            expireAt: new Date(Date.now() + 86400000),
        });
        return Match.create({ users: [userAId, userBId], request: partnerRequest._id, status: "active" });
    };

    it("delivers a chat message between two actively matched users", async () => {
        const { cookie: cookieA, user: userA } = await registerAndGetCookie("chata@example.com");
        const { cookie: cookieB, user: userB } = await registerAndGetCookie("chatb@example.com");

        await createActiveMatch(userA.id, userB.id);

        const socketA = await connectClient(cookieA);
        const socketB = await connectClient(cookieB);

        const received = new Promise((resolve) => {
            socketB.on("chat:receive_message", resolve);
        });

        socketA.emit("chat:send_message", { recipientId: userB.id, content: "Hello there" });

        const { message } = await received;
        expect(message.content).toBe("Hello there");
        expect(message.sender).toBe(userA.id);

        socketA.close();
        socketB.close();
    });

    it("refuses a chat message between users without an active match", async () => {
        const { cookie: cookieA } = await registerAndGetCookie("nomatcha@example.com");
        const { cookie: cookieB, user: userB } = await registerAndGetCookie("nomatchb@example.com");

        const socketA = await connectClient(cookieA);
        const socketB = await connectClient(cookieB);

        const errorEvent = new Promise((resolve) => {
            socketA.on("chat:error", resolve);
        });

        socketA.emit("chat:send_message", { recipientId: userB.id, content: "Should fail" });

        const error = await errorEvent;
        expect(error.code).toBe("CHAT_NOT_ALLOWED");

        socketA.close();
        socketB.close();
    });
});
