const Session = require("../models/session.model");
const Review = require("../models/review.model");

/**
 * Weight distribution (total 100%) for calculating user match compatibility scores.
 */
const MATCH_WEIGHT = {
  activity: 30,
  location: 20,
  availability: 25,
  skill: 15,
  history: 15,
  rating: 10,
};

/**
 * Skill level mapping to numeric scale for distance comparison.
 */
const SKILL_LEVELS = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
};

/**
 * Calculates time slot overlap ratio between candidate availability and requested time range.
 *
 * @param {string} candidateStart - Start time of candidate.
 * @param {string} candidateEnd - End time of candidate.
 * @param {string} requestedStart - Start time requested by user.
 * @param {string} requestedEnd - End time requested by user.
 * @returns {number} Overlap multiplier between 0 and 1.
 */
const calculateTimeOverlap = (candidateStart, candidateEnd, requestedStart, requestedEnd) => {
  if (!requestedStart || !requestedEnd) {
    return 0;
  }

  // Full overlap
  if (candidateStart <= requestedStart && candidateEnd >= requestedEnd) {
    return 1;
  }

  // Partial overlap check
  const overlaps = candidateStart < requestedEnd && candidateEnd > requestedStart;

  return overlaps ? 0.6 : 0;
};

/**
 * Calculates weighted match score (0-100) and breakdown for a user profile based on search criteria.
 *
 * @param {Object} profile - User profile document containing skills (activity + level pairs), location, availability, and rating.
 * @param {Object} criteria - Search criteria provided by requesting user.
 * @param {Map<string, number>} [affinityMap] - Searcher's per-activity affinity ratios (0-1), from buildActivityAffinityMap. Omitted/empty for a searcher with no completed session history.
 * @returns {{score: number, breakdown: Object}} Match score percentage and category breakdown.
 */
const calculateMatchScore = (profile, criteria, affinityMap) => {
  let earnedScore = 0;
  let availableWeight = 0;

  const breakdown = {};

  // -------------------------
  // 1. Activity Match (30%)
  // -------------------------
  if (criteria.activity) {
    availableWeight += MATCH_WEIGHT.activity;

    const activityMatch = profile.skills.some((skill) => {
      return skill.activity._id.toString() == criteria.activity;
    });
    breakdown.activity = activityMatch ? MATCH_WEIGHT.activity : 0;
    earnedScore += breakdown.activity;
  }

  // -------------------------
  // 2. Location Match (20%)
  // -------------------------
  /**
   * Distance scoring uses a linear decay curve:
   * - Within 2 km: Full score (100% of location weight).
   * - Between 2 km and radiusKm: Decreases linearly from 1.0 to 0.0 using formula:
   *   ratio = 1 - (km - 2) / (radiusKm - 2), clamped to range [0, 1].
   * - Beyond radiusKm: 0 score.
   * 
   * Linear decay is simple, predictable, and easy to explain. It can later be switched
   * to exponential decay if distance penalty requires non-linear scaling.
   */
  if (criteria.radiusKm && profile.distanceMeters !== undefined) {
    availableWeight += MATCH_WEIGHT.location;

    const km = profile.distanceMeters / 1000;
    const radiusKm = Number(criteria.radiusKm);

    let ratio = 0;
    if (km <= 2) {
      ratio = 1;
    } else if (radiusKm > 2) {
      ratio = 1 - (km - 2) / (radiusKm - 2);
      ratio = Math.max(0, Math.min(1, ratio));
    }

    breakdown.location = MATCH_WEIGHT.location * ratio;
    earnedScore += breakdown.location;
  } else if (criteria.city) {
    availableWeight += MATCH_WEIGHT.location;

    const candidateCity = profile.location?.city?.trim().toLowerCase();
    const searchCity = criteria.city.trim().toLowerCase();
    const locationMatch =
      candidateCity &&
      searchCity &&
      (candidateCity === searchCity || candidateCity.includes(searchCity) || searchCity.includes(candidateCity));

    breakdown.location = locationMatch ? MATCH_WEIGHT.location : 0;
    earnedScore += breakdown.location;
  }

  // -------------------------
  // 3. Availability Match (25%)
  // -------------------------
  if (criteria.day) {
    availableWeight += MATCH_WEIGHT.availability;

    const availability = profile.availability.find((slot) => slot.day === criteria.day);

    if (!availability) {
      breakdown.availability = 0;
    } else if (!criteria.startTime || !criteria.endTime) {
      breakdown.availability = MATCH_WEIGHT.availability;
    } else {
      const overlap = calculateTimeOverlap(
        availability.startTime,
        availability.endTime,
        criteria.startTime,
        criteria.endTime
      );
      breakdown.availability = MATCH_WEIGHT.availability * overlap;
    }

    earnedScore += breakdown.availability;
  }

  // -------------------------
  // 4. Skill Level Match (15%)
  // -------------------------
  /**
   * When a specific activity was requested, compare against the candidate's
   * level for *that* activity. Otherwise (skill level filter with no
   * activity chosen) give the candidate the benefit of their closest-scoring
   * skill across everything they do.
   */
  if (criteria.skillLevel) {
    availableWeight += MATCH_WEIGHT.skill;

    const requestedSkill = SKILL_LEVELS[criteria.skillLevel];

    let candidateSkill;
    if (criteria.activity) {
      const matchingSkill = profile.skills.find(
        (skill) => skill.activity._id.toString() == criteria.activity
      );
      candidateSkill = matchingSkill ? SKILL_LEVELS[matchingSkill.level] : undefined;
    } else {
      candidateSkill = profile.skills.reduce((best, skill) => {
        const level = SKILL_LEVELS[skill.level];
        if (best === undefined || Math.abs(level - requestedSkill) < Math.abs(best - requestedSkill)) {
          return level;
        }
        return best;
      }, undefined);
    }

    if (candidateSkill === undefined) {
      breakdown.skill = 0;
    } else if (candidateSkill === requestedSkill) {
      breakdown.skill = MATCH_WEIGHT.skill;
    } else if (Math.abs(candidateSkill - requestedSkill) === 1) {
      breakdown.skill = MATCH_WEIGHT.skill * 0.5;
    } else {
      breakdown.skill = 0;
    }

    earnedScore += breakdown.skill;
  }

  // -------------------------
  // 5. Your History (15%)
  // -------------------------
  /**
   * Personalization signal, absent for a first-time searcher: how well this
   * candidate's activities line up with ones the searcher has actually
   * completed (not just cancelled) and rated well in the past. `affinityMap`
   * is built once per search by buildActivityAffinityMap, keyed by activity
   * id -> a 0-1 ratio blending completion rate and average rating given.
   */
  if (affinityMap && affinityMap.size > 0) {
    availableWeight += MATCH_WEIGHT.history;

    const candidateActivityIds = (profile.skills || []).map((s) =>
      (s.activity._id || s.activity).toString()
    );
    const bestAffinity = candidateActivityIds.reduce((best, id) => {
      const ratio = affinityMap.get(id);
      return ratio !== undefined && ratio > best ? ratio : best;
    }, 0);

    breakdown.history = MATCH_WEIGHT.history * bestAffinity;
    earnedScore += breakdown.history;
  }

  // -------------------------
  // 6. Rating Score (10%)
  // -------------------------
  availableWeight += MATCH_WEIGHT.rating;

  const rating = profile.averageRating || 0;
  // Unrated users receive a neutral default score ratio (0.5)
  const ratingScore = rating === 0 ? 0.5 : Math.min(rating / 5, 1);

  breakdown.rating = MATCH_WEIGHT.rating * ratingScore;
  earnedScore += breakdown.rating;

  // -------------------------
  // Normalize Score to 100%
  // -------------------------
  const score = availableWeight === 0 ? 0 : (earnedScore / availableWeight) * 100;

  return {
    score: Math.round(score),
    breakdown: {
      activity: Math.round(breakdown.activity || 0),
      location: Math.round(breakdown.location || 0),
      availability: Math.round(breakdown.availability || 0),
      skill: Math.round(breakdown.skill || 0),
      history: Math.round(breakdown.history || 0),
      rating: Math.round(breakdown.rating || 0),
    },
  };
};

/**
 * Returns a human-readable quality label for a numeric match score.
 *
 * @param {number} score - Calculated match score (0-100).
 * @returns {string} Quality label description ("Excellent match", "Good match", "Fair match", or "Low match").
 */
const getMatchQuality = (score) => {
  if (score >= 80) {
    return "Excellent match";
  }
  if (score >= 60) {
    return "Good match";
  }
  if (score >= 40) {
    return "Fair match";
  }
  return "Low match";
};

/**
 * Builds the searcher's personalization signal for calculateMatchScore's
 * "Your History" category: for each activity they have a completed or
 * cancelled session in, a 0-1 affinity ratio blending completion rate
 * (did they actually follow through?) and the average rating they gave
 * (did they enjoy it?). An activity they've never done has no entry —
 * absence, not a 0, so it neither helps nor hurts a candidate's score.
 *
 * @param {string} userId
 * @returns {Promise<Map<string, number>>} activityId -> affinity ratio (0-1)
 */
const buildActivityAffinityMap = async (userId) => {
  const sessions = await Session.find({
    participants: userId,
    status: {
      $in: [Session.SESSION_STATUSES.COMPLETED, Session.SESSION_STATUSES.CANCELLED],
    },
  }).select("activity status");

  if (sessions.length === 0) {
    return new Map();
  }

  const reviews = await Review.find({
    session: { $in: sessions.map((s) => s._id) },
    reviewer: userId,
  }).select("session rating");

  const ratingBySession = new Map(reviews.map((r) => [r.session.toString(), r.rating]));

  // activityId -> { completed, cancelled, ratingSum, ratingCount }
  const perActivity = new Map();

  sessions.forEach((s) => {
    if (!s.activity) return;

    const activityId = s.activity.toString();
    const entry = perActivity.get(activityId) || {
      completed: 0,
      cancelled: 0,
      ratingSum: 0,
      ratingCount: 0,
    };

    if (s.status === Session.SESSION_STATUSES.COMPLETED) {
      entry.completed += 1;
      const rating = ratingBySession.get(s._id.toString());
      if (rating !== undefined) {
        entry.ratingSum += rating;
        entry.ratingCount += 1;
      }
    } else {
      entry.cancelled += 1;
    }

    perActivity.set(activityId, entry);
  });

  const affinityMap = new Map();

  perActivity.forEach((entry, activityId) => {
    const total = entry.completed + entry.cancelled;
    const completionRate = total > 0 ? entry.completed / total : 0;
    // No review left for a completed session isn't a bad sign — treat it as
    // mildly positive (they showed up) rather than penalizing silence to 0.
    const ratingRatio = entry.ratingCount > 0 ? entry.ratingSum / entry.ratingCount / 5 : 0.6;

    const ratio = Math.max(0, Math.min(1, 0.5 * completionRate + 0.5 * ratingRatio));
    affinityMap.set(activityId, ratio);
  });

  return affinityMap;
};

module.exports = {
  calculateMatchScore,
  getMatchQuality,
  buildActivityAffinityMap,
};


   

