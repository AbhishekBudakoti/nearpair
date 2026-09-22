const request = require("supertest");
const app = require("../app");
const db = require("./helpers/db");
const { registerAndLogin } = require("./helpers/auth");
const PartnerRequest = require("../models/partnerRequest.model");
const Match = require("../models/match.model");
const Session = require("../models/session.model");
const Activity = require("../models/activity.model");
const Category = require("../models/category.model");
const Review = require("../models/review.model");

beforeAll(async () => {
    await db.connect();
});

afterEach(async () => {
    await db.clearDatabase();
});

afterAll(async () => {
    await db.closeDatabase();
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

describe("GET /api/sessions/history", () => {
    it("requires authentication", async () => {
        const res = await request(app).get("/api/sessions/history");
        expect(res.status).toBe(401);
    });

    it("returns empty stats and timeline for a user with no past sessions", async () => {
        const { agent } = await registerAndLogin();

        const res = await agent.get("/api/sessions/history");

        expect(res.status).toBe(200);
        expect(res.body.data.stats).toEqual({
            totalCompleted: 0,
            totalCancelled: 0,
            totalHours: 0,
            uniquePartners: 0,
            topActivity: null,
            averageRatingGiven: null,
        });
        expect(res.body.data.timeline).toEqual([]);

        // 6 trailing months still plot, just at 0 / null.
        expect(res.body.data.trends.sessionsByMonth).toHaveLength(6);
        expect(res.body.data.trends.sessionsByMonth.every((m) => m.count === 0)).toBe(true);
        expect(res.body.data.trends.ratingTrend).toHaveLength(6);
        expect(res.body.data.trends.ratingTrend.every((m) => m.averageRating === null)).toBe(true);
        expect(res.body.data.trends.activityMix).toEqual([]);
    });

    it("aggregates completed sessions into stats and includes review info in the timeline", async () => {
        // userA is the one we query as, so keep its authenticated agent.
        const { agent: agentA, user: userA } = await registerAndLogin();
        const { user: userB } = await registerAndLogin();

        const match = await createActiveMatch(userA.id, userB.id);
        const category = await Category.create({ name: "Sports" });
        const activity = await Activity.create({ name: "Tennis", category: category._id });

        const completedSession = await Session.create({
            match: match._id,
            participants: [userA.id, userB.id],
            activity: activity._id,
            proposedBy: userA.id,
            scheduledAt: new Date(Date.now() - 3600000),
            durationMinutes: 90,
            status: "completed",
        });

        await Session.create({
            match: match._id,
            participants: [userA.id, userB.id],
            activity: activity._id,
            proposedBy: userA.id,
            scheduledAt: new Date(Date.now() - 7200000),
            durationMinutes: 60,
            status: "cancelled",
            cancelledBy: userB.id,
            cancelReason: "Something came up",
        });

        // userA rates userB 5 stars; userB rates userA back 3 stars.
        await Review.create({
            session: completedSession._id,
            reviewer: userA.id,
            reviewee: userB.id,
            rating: 5,
            comment: "Great session",
        });
        await Review.create({
            session: completedSession._id,
            reviewer: userB.id,
            reviewee: userA.id,
            rating: 3,
            comment: "It was fine",
        });

        const res = await agentA.get("/api/sessions/history");

        expect(res.status).toBe(200);
        expect(res.body.data.stats.totalCompleted).toBe(1);
        expect(res.body.data.stats.totalCancelled).toBe(1);
        expect(res.body.data.stats.totalHours).toBe(1.5);
        expect(res.body.data.stats.uniquePartners).toBe(1);
        expect(res.body.data.stats.topActivity).toMatchObject({ name: "Tennis", count: 1 });
        expect(res.body.data.stats.averageRatingGiven).toBe(5);

        expect(res.body.data.timeline).toHaveLength(2);
        const completedEntry = res.body.data.timeline.find((e) => e.status === "completed");
        expect(completedEntry.myReview.rating).toBe(5);
        expect(completedEntry.partnerReview.rating).toBe(3);

        const cancelledEntry = res.body.data.timeline.find((e) => e.status === "cancelled");
        expect(cancelledEntry.cancelReason).toBe("Something came up");

        // Trends: the one completed session (and userA's 3-star received
        // review for it) both land in the current month's bucket.
        const { sessionsByMonth, activityMix, ratingTrend } = res.body.data.trends;
        expect(sessionsByMonth).toHaveLength(6);
        expect(sessionsByMonth[5].count).toBe(1); // last bucket = current month
        expect(sessionsByMonth.slice(0, 5).every((m) => m.count === 0)).toBe(true);

        expect(activityMix).toEqual([{ id: activity._id.toString(), name: "Tennis", count: 1 }]);

        expect(ratingTrend).toHaveLength(6);
        expect(ratingTrend[5].averageRating).toBe(3);
        expect(ratingTrend.slice(0, 5).every((m) => m.averageRating === null)).toBe(true);
    });
});
