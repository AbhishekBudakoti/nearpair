const { calculateMatchScore, getMatchQuality } = require("../services/matching.service");

const activityId = "507f1f77bcf86cd799439011";
const otherActivityId = "507f1f77bcf86cd799439012";

const baseProfile = () => ({
    skills: [{ activity: { _id: activityId }, level: "intermediate" }],
    availability: [{ day: "monday", startTime: "18:00", endTime: "20:00" }],
    location: { city: "Springfield" },
    averageRating: 0,
});

describe("calculateMatchScore", () => {
    it("scores a full match across every criterion as 100", () => {
        const profile = { ...baseProfile(), averageRating: 5 };
        const { score, breakdown } = calculateMatchScore(profile, {
            activity: activityId,
            city: "springfield",
            day: "monday",
            startTime: "18:00",
            endTime: "19:00",
            skillLevel: "intermediate",
        });

        expect(score).toBe(100);
        expect(breakdown.activity).toBe(30);
        expect(breakdown.availability).toBe(25);
        expect(breakdown.skill).toBe(15);
    });

    it("scores 0 activity weight when the activity doesn't match", () => {
        const { breakdown } = calculateMatchScore(baseProfile(), {
            activity: otherActivityId,
        });

        expect(breakdown.activity).toBe(0);
    });

    it("gives half credit for a skill level one step away", () => {
        const { breakdown } = calculateMatchScore(baseProfile(), {
            skillLevel: "advanced",
        });

        expect(breakdown.skill).toBe(8); // 15 * 0.5 rounded
    });

    it("gives zero skill credit two steps away", () => {
        const profile = {
            ...baseProfile(),
            skills: [{ activity: { _id: activityId }, level: "beginner" }],
        };
        const { breakdown } = calculateMatchScore(profile, { skillLevel: "advanced" });

        expect(breakdown.skill).toBe(0);
    });

    it("compares against the specific activity's level when an activity is requested", () => {
        const profile = {
            ...baseProfile(),
            skills: [
                { activity: { _id: activityId }, level: "beginner" },
                { activity: { _id: otherActivityId }, level: "advanced" },
            ],
        };
        const { breakdown } = calculateMatchScore(profile, {
            activity: activityId,
            skillLevel: "beginner",
        });

        expect(breakdown.skill).toBe(15);
    });

    it("uses the closest-scoring skill when no activity is requested", () => {
        const profile = {
            ...baseProfile(),
            skills: [
                { activity: { _id: activityId }, level: "beginner" },
                { activity: { _id: otherActivityId }, level: "advanced" },
            ],
        };
        const { breakdown } = calculateMatchScore(profile, { skillLevel: "advanced" });

        expect(breakdown.skill).toBe(15); // "advanced" skill matches exactly
    });

    it("applies linear distance decay for location", () => {
        const profile = { ...baseProfile(), distanceMeters: 6000 }; // 6km
        const { breakdown } = calculateMatchScore(profile, { radiusKm: 10 });

        // ratio = 1 - (6-2)/(10-2) = 0.5 -> 20 * 0.5 = 10
        expect(breakdown.location).toBe(10);
    });

    it("gives full location score within the 2km free zone", () => {
        const profile = { ...baseProfile(), distanceMeters: 1000 };
        const { breakdown } = calculateMatchScore(profile, { radiusKm: 10 });

        expect(breakdown.location).toBe(20);
    });

    it("gives unrated profiles a neutral 0.5 rating ratio", () => {
        const { breakdown } = calculateMatchScore(baseProfile(), {});
        expect(breakdown.rating).toBe(5); // 10 * 0.5
    });

    it("returns 0 when no criteria are provided and profile is unrated", () => {
        const { score } = calculateMatchScore(baseProfile(), {});
        // Only the always-on rating weight applies -> neutral 0.5 ratio -> 100 * 0.5
        expect(score).toBe(50);
    });

    describe("with an affinity map (personalization)", () => {
        it("ignores history entirely when no affinity map is passed", () => {
            const { breakdown } = calculateMatchScore(baseProfile(), {});
            expect(breakdown.history).toBe(0);
        });

        it("ignores history when the affinity map is empty (first-time searcher)", () => {
            const { breakdown } = calculateMatchScore(baseProfile(), {}, new Map());
            expect(breakdown.history).toBe(0);
        });

        it("awards full history credit for a perfect affinity match", () => {
            const affinityMap = new Map([[activityId, 1]]);
            const { breakdown } = calculateMatchScore(baseProfile(), {}, affinityMap);
            expect(breakdown.history).toBe(15);
        });

        it("scales history credit by the affinity ratio", () => {
            const affinityMap = new Map([[activityId, 0.6]]);
            const { breakdown } = calculateMatchScore(baseProfile(), {}, affinityMap);
            expect(breakdown.history).toBe(9); // 15 * 0.6
        });

        it("gives 0 history credit when the candidate's activities aren't in the map", () => {
            const affinityMap = new Map([[otherActivityId, 1]]);
            const { breakdown } = calculateMatchScore(baseProfile(), {}, affinityMap);
            expect(breakdown.history).toBe(0);
        });

        it("takes the best affinity across a candidate's multiple activities", () => {
            const profile = {
                ...baseProfile(),
                skills: [
                    { activity: { _id: activityId }, level: "intermediate" },
                    { activity: { _id: otherActivityId }, level: "intermediate" },
                ],
            };
            const affinityMap = new Map([
                [activityId, 0.3],
                [otherActivityId, 0.9],
            ]);
            const { breakdown } = calculateMatchScore(profile, {}, affinityMap);
            expect(breakdown.history).toBe(14); // 15 * 0.9 rounded
        });

        it("dilutes other categories once history counts toward available weight", () => {
            const affinityMap = new Map([[activityId, 1]]);
            const profile = { ...baseProfile(), averageRating: 5 };
            const { score } = calculateMatchScore(profile, {}, affinityMap);
            // rating (10*1) + history (15*1) over available weight (10+15) -> 100
            expect(score).toBe(100);
        });
    });
});

describe("getMatchQuality", () => {
    it.each([
        [95, "Excellent match"],
        [80, "Excellent match"],
        [65, "Good match"],
        [60, "Good match"],
        [45, "Fair match"],
        [40, "Fair match"],
        [10, "Low match"],
    ])("labels a score of %i as %s", (score, label) => {
        expect(getMatchQuality(score)).toBe(label);
    });
});
