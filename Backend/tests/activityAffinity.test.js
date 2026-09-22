const db = require("./helpers/db");
const { buildActivityAffinityMap } = require("../services/matching.service");
const User = require("../models/user.model");
const Activity = require("../models/activity.model");
const Category = require("../models/category.model");
const PartnerRequest = require("../models/partnerRequest.model");
const Match = require("../models/match.model");
const Session = require("../models/session.model");
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

const createUser = (email) => User.create({ name: email, email, password: "hashed-placeholder" });

// Activity.category is required — one throwaway category per test, since
// afterEach clears the database.
let categoryId;
beforeEach(async () => {
    const category = await Category.create({ name: "Sports" });
    categoryId = category._id;
});

const createActivity = (name) => Activity.create({ name, category: categoryId });

const createMatch = async (userAId, userBId) => {
    const pr = await PartnerRequest.create({
        sender: userAId,
        recipient: userBId,
        status: "accepted",
        expireAt: new Date(Date.now() + 86400000),
    });
    return Match.create({ users: [userAId, userBId], request: pr._id, status: "active" });
};

describe("buildActivityAffinityMap", () => {
    it("returns an empty map for a user with no session history", async () => {
        const user = await createUser("nohistory@example.com");
        const map = await buildActivityAffinityMap(user._id);
        expect(map.size).toBe(0);
    });

    it("gives a fully-completed, well-rated activity a high affinity ratio", async () => {
        const userA = await createUser("affinity.a1@example.com");
        const userB = await createUser("affinity.b1@example.com");
        const match = await createMatch(userA._id, userB._id);
        const tennis = await createActivity("Tennis");

        const session = await Session.create({
            match: match._id,
            participants: [userA._id, userB._id],
            activity: tennis._id,
            proposedBy: userA._id,
            scheduledAt: new Date(Date.now() - 3600000),
            status: "completed",
        });

        await Review.create({
            session: session._id,
            reviewer: userA._id,
            reviewee: userB._id,
            rating: 5,
        });

        const map = await buildActivityAffinityMap(userA._id);

        // completionRate 1 (0.5 weight) + ratingRatio 1 (5/5, 0.5 weight) = 1
        expect(map.get(tennis._id.toString())).toBe(1);
    });

    it("gives a mostly-cancelled activity a low affinity ratio", async () => {
        const userA = await createUser("affinity.a2@example.com");
        const userB = await createUser("affinity.b2@example.com");
        const match = await createMatch(userA._id, userB._id);
        const chess = await createActivity("Chess");

        await Session.create({
            match: match._id,
            participants: [userA._id, userB._id],
            activity: chess._id,
            proposedBy: userA._id,
            scheduledAt: new Date(Date.now() - 3600000),
            status: "cancelled",
            cancelledBy: userB._id,
            cancelReason: "No-show",
        });

        const map = await buildActivityAffinityMap(userA._id);

        // completionRate 0 (0.5 weight) + no reviews -> neutral 0.6 ratingRatio (0.5 weight) = 0.3
        expect(map.get(chess._id.toString())).toBeCloseTo(0.3, 5);
    });

    it("does not include an activity the user has never had a session in", async () => {
        const userA = await createUser("affinity.a3@example.com");
        const userB = await createUser("affinity.b3@example.com");
        const match = await createMatch(userA._id, userB._id);
        const tennis = await createActivity("Tennis");
        await createActivity("Chess");

        await Session.create({
            match: match._id,
            participants: [userA._id, userB._id],
            activity: tennis._id,
            proposedBy: userA._id,
            scheduledAt: new Date(Date.now() - 3600000),
            status: "completed",
        });

        const map = await buildActivityAffinityMap(userA._id);
        expect(map.size).toBe(1);
        expect(map.has(tennis._id.toString())).toBe(true);
    });

    it("only counts the searcher's own review, not the partner's", async () => {
        const userA = await createUser("affinity.a4@example.com");
        const userB = await createUser("affinity.b4@example.com");
        const match = await createMatch(userA._id, userB._id);
        const tennis = await createActivity("Tennis");

        const session = await Session.create({
            match: match._id,
            participants: [userA._id, userB._id],
            activity: tennis._id,
            proposedBy: userA._id,
            scheduledAt: new Date(Date.now() - 3600000),
            status: "completed",
        });

        // userA gave 1 star, userB (the partner) gave 5 — only userA's rating
        // should feed userA's own affinity map.
        await Review.create({ session: session._id, reviewer: userA._id, reviewee: userB._id, rating: 1 });
        await Review.create({ session: session._id, reviewer: userB._id, reviewee: userA._id, rating: 5 });

        const map = await buildActivityAffinityMap(userA._id);

        // completionRate 1 (0.5) + ratingRatio 1/5=0.2 (0.5) = 0.6
        expect(map.get(tennis._id.toString())).toBeCloseTo(0.6, 5);
    });
});
