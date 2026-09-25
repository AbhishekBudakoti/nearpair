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
        .send({ name: "Socket User", email, password: "Password123!" });
    const res = await agent.post("/api/auth/login").send({ email, password: "Password123!" });
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

// Production path: the socket connects straight to the backend origin, where
// the (proxy-scoped) cookie never arrives, so it authenticates with a
// short-lived token from GET /api/auth/socket-token instead.
const getSocketToken = async (cookie) => {
    const res = await request(app).get("/api/auth/socket-token").set("Cookie", cookie);
    return res.body.data.token;
};

const connectWithToken = (token) =>
    new Promise((resolve, reject) => {
        const socket = Client(`http://localhost:${port}`, {
            transports: ["websocket"],
            auth: { token },
            forceNew: true,
        });
        socket.on("connect", () => resolve(socket));
        socket.on("connect_error", (err) => reject(err));
    });

const createActiveMatch = async (userAId, userBId) => {
    const partnerRequest = await PartnerRequest.create({
        sender: userAId,
        recipient: userBId,
        status: "accepted",
        expireAt: new Date(Date.now() + 86400000),
    });
    return Match.create({ users: [userAId, userBId], request: partnerRequest._id, status: "active" });
};

describe("Socket.IO token auth (production path)", () => {
    it("requires the session cookie to issue a socket token", async () => {
        const res = await request(app).get("/api/auth/socket-token");
        expect(res.status).toBe(401);
    });

    it("accepts a handshake carrying only a socket token, no cookie", async () => {
        const { cookie } = await registerAndGetCookie("tokenauth@example.com");
        const token = await getSocketToken(cookie);

        expect(typeof token).toBe("string");

        const socket = await connectWithToken(token);
        expect(socket.connected).toBe(true);
        socket.close();
    });

    it("rejects a handshake with a garbage socket token", async () => {
        await expect(connectWithToken("not-a-real-jwt")).rejects.toThrow(/Invalid or expired token/);
    });

    it("delivers chat between two token-authenticated users", async () => {
        const { cookie: cookieA, user: userA } = await registerAndGetCookie("tokchata@example.com");
        const { cookie: cookieB, user: userB } = await registerAndGetCookie("tokchatb@example.com");
        await createActiveMatch(userA.id, userB.id);

        const socketA = await connectWithToken(await getSocketToken(cookieA));
        const socketB = await connectWithToken(await getSocketToken(cookieB));

        const received = new Promise((resolve) => socketB.on("chat:receive_message", resolve));
        const acked = new Promise((resolve) => socketA.on("chat:message_sent", resolve));

        socketA.emit("chat:send_message", { recipientId: userB.id, content: "Hi via token" });

        const { message } = await received;
        expect(message.content).toBe("Hi via token");
        await acked;

        socketA.close();
        socketB.close();
    });
});

describe("Socket.IO typing, presence and blocking", () => {
    it("relays typing and stop_typing to a matched partner", async () => {
        const { cookie: cookieA, user: userA } = await registerAndGetCookie("typinga@example.com");
        const { cookie: cookieB, user: userB } = await registerAndGetCookie("typingb@example.com");
        await createActiveMatch(userA.id, userB.id);

        const socketA = await connectClient(cookieA);
        const socketB = await connectClient(cookieB);

        const typing = new Promise((resolve) => socketB.on("chat:typing", resolve));
        socketA.emit("chat:typing", { recipientId: userB.id });
        expect((await typing).userId).toBe(userA.id);

        const stopped = new Promise((resolve) => socketB.on("chat:stop_typing", resolve));
        socketA.emit("chat:stop_typing", { recipientId: userB.id });
        expect((await stopped).userId).toBe(userA.id);

        socketA.close();
        socketB.close();
    });

    it("broadcasts presence:offline once a user's last socket disconnects", async () => {
        const { cookie: cookieA } = await registerAndGetCookie("offlinea@example.com");
        const { cookie: cookieB, user: userB } = await registerAndGetCookie("offlineb@example.com");

        const socketA = await connectClient(cookieA);
        const socketB = await connectClient(cookieB);

        const offline = new Promise((resolve) => {
            socketA.on("presence:offline", (data) => {
                if (data.userId === userB.id) resolve(data);
            });
        });

        socketB.close();

        expect((await offline).userId).toBe(userB.id);
        socketA.close();
    });

    it("refuses chat once the partner has blocked the sender", async () => {
        const { cookie: cookieA, user: userA } = await registerAndGetCookie("blocka@example.com");
        const { cookie: cookieB, user: userB } = await registerAndGetCookie("blockb@example.com");
        await createActiveMatch(userA.id, userB.id);

        const blockRes = await request(app).post(`/api/blocks/${userA.id}`).set("Cookie", cookieB);
        expect(blockRes.status).toBeLessThan(300);

        const socketA = await connectClient(cookieA);

        const errorEvent = new Promise((resolve) => socketA.on("chat:error", resolve));
        socketA.emit("chat:send_message", { recipientId: userB.id, content: "Still there?" });

        expect((await errorEvent).code).toBe("CHAT_NOT_ALLOWED");
        socketA.close();
    });
});
