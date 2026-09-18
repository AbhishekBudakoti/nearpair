const mongoose = require("mongoose");
const Session = require("../models/session.model");
const Match = require("../models/match.model");
const Activity = require("../models/activity.model");
const Review = require("../models/review.model");
const asyncHandler = require("../middlewares/asyncHandler");
const { successResponse } = require("../utils/response");
const { createNotification } = require("../services/notification.service");
const { getIO } = require("../socket/socket");

/**
 * Helper to get current user ID string from req.user
 */
const getCurrentUserId = (req) => {
  return (req.user?.id || req.user?._id || "").toString();
};

/**
 * @desc    Propose a new session
 * @route   POST /api/sessions
 * @access  Private
 */
const proposeSession = asyncHandler(async (req, res) => {
  const { match: matchId, activity, scheduledAt, durationMinutes, location } = req.body;
  const currentUserId = getCurrentUserId(req);

  if (!matchId || !activity || !scheduledAt) {
    const error = new Error("Match, activity, and scheduledAt are required");
    error.statusCode = 400;
    throw error;
  }

  if (!mongoose.Types.ObjectId.isValid(matchId)) {
    const error = new Error("Invalid match ID");
    error.statusCode = 400;
    throw error;
  }

  if (!mongoose.Types.ObjectId.isValid(activity)) {
    const error = new Error("Invalid activity ID");
    error.statusCode = 400;
    throw error;
  }

  // A well-formed ObjectId can still point at nothing — verify it exists and
  // is active, the same way createProfile does.
  const activityExists = await Activity.countDocuments({
    _id: activity,
    isActive: true,
  });

  if (!activityExists) {
    const error = new Error("Activity not found");
    error.statusCode = 400;
    throw error;
  }

  const match = await Match.findById(matchId);
  if (!match) {
    const error = new Error("Match not found");
    error.statusCode = 404;
    throw error;
  }

  const isParticipant = (match.users || []).some(
    (u) => u.toString() === currentUserId
  );
  if (!isParticipant) {
    const error = new Error("You are not a participant in this match");
    error.statusCode = 403;
    throw error;
  }

  const creationValidation = Session.validateCreation(scheduledAt, match);
  if (!creationValidation.valid) {
    const error = new Error(creationValidation.error);
    error.statusCode = 400;
    throw error;
  }

  const session = await Session.create({
    match: match._id,
    participants: match.users,
    activity,
    proposedBy: currentUserId,
    scheduledAt,
    durationMinutes: durationMinutes || 60,
    location,
    status: Session.SESSION_STATUSES.REQUESTED,
  });

  const partnerId = (match.users || []).find((u) => u.toString() !== currentUserId);
  if (partnerId) {
    try {
      await createNotification({
        recipient: partnerId,
        sender: currentUserId,
        type: "session_proposed",
        message: "Proposed a new session with you",
        relatedSession: session._id,
      });
    } catch (err) {
      console.error("Error creating session_proposed notification:", err);
    }
  }

  const populatedSession = await Session.findById(session._id)
    .populate("match")
    .populate("participants", "name email")
    .populate("activity", "name")
    .populate("proposedBy", "name email");

  return successResponse(res, { session: populatedSession }, "Session proposed successfully", 201);
});

/**
 * @desc    Get user's sessions (supports ?status= and ?upcoming=true)
 * @route   GET /api/sessions
 * @access  Private
 */
const getSessions = asyncHandler(async (req, res) => {
  const currentUserId = getCurrentUserId(req);

  // Security: Always filter by req.user ID; ignore user ID from query string
  const filter = {
    participants: currentUserId,
  };

  if (req.query.status) {
    filter.status = req.query.status;
  }

  const isUpcoming =
    req.query.upcoming === "true" || req.query.upcoming === "1";

  if (isUpcoming) {
    filter.scheduledAt = { $gte: new Date() };
  }

  const sessions = await Session.find(filter)
    .populate("match")
    .populate("participants", "name email")
    .populate("activity", "name")
    .populate("proposedBy", "name email")
    .populate("cancelledBy", "name email")
    // Upcoming = soonest first (a to-do list).
    // History = most recent first.
    .sort({ scheduledAt: isUpcoming ? 1 : -1 });

  return successResponse(
    res,
    { count: sessions.length, sessions },
    "Sessions retrieved successfully"
  );
});

/**
 * @desc    Activity history: completed/cancelled sessions with review info,
 *          plus summary stats (partners met, hours spent, top activity...).
 * @route   GET /api/sessions/history
 * @access  Private
 */
const getSessionHistory = asyncHandler(async (req, res) => {
  const currentUserId = getCurrentUserId(req);

  const sessions = await Session.find({
    participants: currentUserId,
    status: {
      $in: [Session.SESSION_STATUSES.COMPLETED, Session.SESSION_STATUSES.CANCELLED],
    },
  })
    .populate("participants", "name email")
    .populate("activity", "name")
    .populate("cancelledBy", "name email")
    .sort({ scheduledAt: -1 });

  const sessionIds = sessions.map((s) => s._id);

  const reviews = await Review.find({ session: { $in: sessionIds } }).select(
    "session reviewer reviewee rating comment"
  );

  // `${sessionId}:${reviewerId}` -> review, so the timeline can show both
  // sides of a session's review (mine and the partner's) without an N+1 query.
  const reviewByKey = new Map();
  reviews.forEach((r) => {
    reviewByKey.set(`${r.session}:${r.reviewer}`, r);
  });

  const completed = sessions.filter(
    (s) => s.status === Session.SESSION_STATUSES.COMPLETED
  );

  const partnerIds = new Set();
  const activityCounts = new Map(); // activityId -> { name, count }
  let totalMinutes = 0;

  completed.forEach((s) => {
    const partner = s.participants.find((p) => p._id.toString() !== currentUserId);
    if (partner) partnerIds.add(partner._id.toString());

    totalMinutes += s.durationMinutes || 0;

    if (s.activity) {
      const key = s.activity._id.toString();
      const entry = activityCounts.get(key) || { name: s.activity.name, count: 0 };
      entry.count += 1;
      activityCounts.set(key, entry);
    }
  });

  let topActivity = null;
  for (const [id, entry] of activityCounts) {
    if (!topActivity || entry.count > topActivity.count) {
      topActivity = { id, name: entry.name, count: entry.count };
    }
  }

  const myGivenReviews = reviews.filter((r) => r.reviewer.toString() === currentUserId);
  const averageRatingGiven = myGivenReviews.length
    ? Math.round(
        (myGivenReviews.reduce((sum, r) => sum + r.rating, 0) / myGivenReviews.length) * 10
      ) / 10
    : null;

  // --- Trends: last 6 months, oldest first, so quiet months still plot as 0 ---
  // reviewee === currentUserId reviews are already in `reviews` (it's scoped
  // to sessions the user took part in), so no extra query is needed here.
  const TREND_MONTHS = 6;
  const MONTH_NAMES = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  // Bucketing entirely in UTC, both for the boundaries below and for real
  // session timestamps: mixing local calendar math with a UTC-derived key
  // (e.g. via toISOString) shifts a bucket by a month for any non-UTC server.
  const monthKey = (date) => date.toISOString().slice(0, 7); // "YYYY-MM"
  const monthLabel = (date) => `${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCFullYear()}`;

  const now = new Date();
  const monthBuckets = Array.from({ length: TREND_MONTHS }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (TREND_MONTHS - 1 - i), 1));
    return { key: monthKey(d), label: monthLabel(d) };
  });

  const sessionCountByMonth = new Map(monthBuckets.map((b) => [b.key, 0]));
  const ratingByMonth = new Map(monthBuckets.map((b) => [b.key, { sum: 0, count: 0 }]));
  const sessionById = new Map(sessions.map((s) => [s._id.toString(), s]));

  completed.forEach((s) => {
    const key = monthKey(new Date(s.scheduledAt));
    if (sessionCountByMonth.has(key)) {
      sessionCountByMonth.set(key, sessionCountByMonth.get(key) + 1);
    }
  });

  reviews
    .filter((r) => r.reviewee.toString() === currentUserId)
    .forEach((r) => {
      const session = sessionById.get(r.session.toString());
      const key = session && monthKey(new Date(session.scheduledAt));
      const bucket = key && ratingByMonth.get(key);
      if (bucket) {
        bucket.sum += r.rating;
        bucket.count += 1;
      }
    });

  const sessionsByMonth = monthBuckets.map((b) => ({
    month: b.key,
    label: b.label,
    count: sessionCountByMonth.get(b.key),
  }));

  const ratingTrend = monthBuckets.map((b) => {
    const bucket = ratingByMonth.get(b.key);
    return {
      month: b.key,
      label: b.label,
      averageRating: bucket.count ? Math.round((bucket.sum / bucket.count) * 10) / 10 : null,
    };
  });

  const activityMix = Array.from(activityCounts.entries())
    .map(([id, entry]) => ({ id, name: entry.name, count: entry.count }))
    .sort((a, b) => b.count - a.count);

  const timeline = sessions.map((s) => {
    const partner = s.participants.find((p) => p._id.toString() !== currentUserId);
    return {
      _id: s._id,
      activity: s.activity,
      partner,
      scheduledAt: s.scheduledAt,
      durationMinutes: s.durationMinutes,
      status: s.status,
      cancelReason: s.cancelReason,
      cancelledBy: s.cancelledBy,
      myReview: reviewByKey.get(`${s._id}:${currentUserId}`) || null,
      partnerReview: partner ? reviewByKey.get(`${s._id}:${partner._id}`) || null : null,
    };
  });

  return successResponse(
    res,
    {
      stats: {
        totalCompleted: completed.length,
        totalCancelled: sessions.length - completed.length,
        totalHours: Math.round((totalMinutes / 60) * 10) / 10,
        uniquePartners: partnerIds.size,
        topActivity,
        averageRatingGiven,
      },
      trends: {
        sessionsByMonth,
        activityMix,
        ratingTrend,
      },
      timeline,
    },
    "Activity history fetched successfully"
  );
});

/**
 * @desc    Get single session by ID
 * @route   GET /api/sessions/:id
 * @access  Private
 */
const getSessionById = asyncHandler(async (req, res) => {
  const currentUserId = getCurrentUserId(req);

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    const error = new Error("Invalid session ID");
    error.statusCode = 400;
    throw error;
  }

  const session = await Session.findById(req.params.id)
    .populate("match")
    .populate("participants", "name email")
    .populate("activity", "name")
    .populate("proposedBy", "name email")
    .populate("cancelledBy", "name email");

  if (!session) {
    const error = new Error("Session not found");
    error.statusCode = 404;
    throw error;
  }

  const isParticipant = (session.participants || []).some(
    (p) => (p._id || p).toString() === currentUserId
  );

  if (!isParticipant) {
    const error = new Error("Access denied to this session");
    error.statusCode = 403;
    throw error;
  }

  return successResponse(res, { session }, "Session retrieved successfully");
});

/**
 * Helper to emit room updates to connected sockets in session room
 */
const emitSessionRoomUpdate = (session) => {
  const io = getIO();
  if (io) {
    io.to(`session:${session._id}`).emit("session:updated", {
      sessionId: session._id,
      status: session.status,
      updatedAt: session.updatedAt,
      cancelledBy: session.cancelledBy,
      cancelReason: session.cancelReason,
    });
  }
};

/**
 * @desc    Partner accepts proposed session
 * @route   PATCH /api/sessions/:id/accept
 * @access  Private
 */
const acceptSession = asyncHandler(async (req, res) => {
  const currentUserId = getCurrentUserId(req);

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    const error = new Error("Invalid session ID");
    error.statusCode = 400;
    throw error;
  }

  const session = await Session.findById(req.params.id);
  if (!session) {
    const error = new Error("Session not found");
    error.statusCode = 404;
    throw error;
  }

  const acceptGuard = Session.validateCanAcceptOrReject(session, currentUserId);
  if (!acceptGuard.valid) {
    const error = new Error(acceptGuard.error);
    error.statusCode = 400;
    throw error;
  }

  const transitionGuard = Session.validateStatusTransition(
    session.status,
    Session.SESSION_STATUSES.ACCEPTED
  );
  if (!transitionGuard.valid) {
    const error = new Error(transitionGuard.error);
    error.statusCode = 400;
    throw error;
  }

  session.status = Session.SESSION_STATUSES.ACCEPTED;
  await session.save();

  emitSessionRoomUpdate(session);

  const proposerId = session.proposedBy ? session.proposedBy.toString() : null;
  if (proposerId && proposerId !== currentUserId) {
    try {
      await createNotification({
        recipient: proposerId,
        sender: currentUserId,
        type: "session_accepted",
        message: "Accepted your proposed session",
        relatedSession: session._id,
      });
    } catch (err) {
      console.error("Error creating session_accepted notification:", err);
    }
  }

  const updated = await Session.findById(session._id)
    .populate("match")
    .populate("participants", "name email")
    .populate("activity", "name")
    .populate("proposedBy", "name email");

  return successResponse(res, { session: updated }, "Session accepted successfully");
});

/**
 * @desc    Partner rejects proposed session
 * @route   PATCH /api/sessions/:id/reject
 * @access  Private
 */
const rejectSession = asyncHandler(async (req, res) => {
  const currentUserId = getCurrentUserId(req);

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    const error = new Error("Invalid session ID");
    error.statusCode = 400;
    throw error;
  }

  const session = await Session.findById(req.params.id);
  if (!session) {
    const error = new Error("Session not found");
    error.statusCode = 404;
    throw error;
  }

  const rejectGuard = Session.validateCanAcceptOrReject(session, currentUserId);
  if (!rejectGuard.valid) {
    const error = new Error(rejectGuard.error);
    error.statusCode = 400;
    throw error;
  }

  const transitionGuard = Session.validateStatusTransition(
    session.status,
    Session.SESSION_STATUSES.CANCELLED
  );
  if (!transitionGuard.valid) {
    const error = new Error(transitionGuard.error);
    error.statusCode = 400;
    throw error;
  }

  session.status = Session.SESSION_STATUSES.CANCELLED;
  session.cancelledBy = currentUserId;
  session.cancelReason = req.body?.cancelReason || "Declined by partner";
  await session.save();

  emitSessionRoomUpdate(session);

  const proposerId = session.proposedBy ? session.proposedBy.toString() : null;
  if (proposerId && proposerId !== currentUserId) {
    try {
      await createNotification({
        recipient: proposerId,
        sender: currentUserId,
        type: "session_rejected",
        message: "Declined your proposed session",
        relatedSession: session._id,
      });
    } catch (err) {
      console.error("Error creating session_rejected notification:", err);
    }
  }

  const updated = await Session.findById(session._id)
    .populate("match")
    .populate("participants", "name email")
    .populate("activity", "name")
    .populate("proposedBy", "name email")
    .populate("cancelledBy", "name email");

  return successResponse(res, { session: updated }, "Session rejected successfully");
});

/**
 * @desc    Either participant cancels session (before completed)
 * @route   PATCH /api/sessions/:id/cancel
 * @access  Private
 */
const cancelSession = asyncHandler(async (req, res) => {
  const currentUserId = getCurrentUserId(req);

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    const error = new Error("Invalid session ID");
    error.statusCode = 400;
    throw error;
  }

  const session = await Session.findById(req.params.id);
  if (!session) {
    const error = new Error("Session not found");
    error.statusCode = 404;
    throw error;
  }

  const isParticipant = (session.participants || []).some(
    (p) => p.toString() === currentUserId
  );
  if (!isParticipant) {
    const error = new Error("Access denied to this session");
    error.statusCode = 403;
    throw error;
  }

  const transitionGuard = Session.validateStatusTransition(
    session.status,
    Session.SESSION_STATUSES.CANCELLED
  );
  if (!transitionGuard.valid) {
    const error = new Error(transitionGuard.error);
    error.statusCode = 400;
    throw error;
  }

  session.status = Session.SESSION_STATUSES.CANCELLED;
  session.cancelledBy = currentUserId;
  session.cancelReason = req.body?.cancelReason || "Cancelled by participant";
  await session.save();

  emitSessionRoomUpdate(session);

  const partnerId = (session.participants || []).find((p) => p.toString() !== currentUserId);
  if (partnerId) {
    try {
      await createNotification({
        recipient: partnerId,
        sender: currentUserId,
        type: "session_cancelled",
        message: "Cancelled the scheduled session",
        relatedSession: session._id,
      });
    } catch (err) {
      console.error("Error creating session_cancelled notification:", err);
    }
  }

  const updated = await Session.findById(session._id)
    .populate("match")
    .populate("participants", "name email")
    .populate("activity", "name")
    .populate("proposedBy", "name email")
    .populate("cancelledBy", "name email");

  return successResponse(res, { session: updated }, "Session cancelled successfully");
});

/**
 * @desc    Mark session as completed ("we actually did this")
 * @route   PATCH /api/sessions/:id/complete
 * @access  Private
 */
const completeSession = asyncHandler(async (req, res) => {
  const currentUserId = getCurrentUserId(req);

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    const error = new Error("Invalid session ID");
    error.statusCode = 400;
    throw error;
  }

  const session = await Session.findById(req.params.id);
  if (!session) {
    const error = new Error("Session not found");
    error.statusCode = 404;
    throw error;
  }

  const isParticipant = (session.participants || []).some(
    (p) => p.toString() === currentUserId
  );
  if (!isParticipant) {
    const error = new Error("Access denied to this session");
    error.statusCode = 403;
    throw error;
  }

  // The transition matrix already restricts completion to `active`, but check
  // the clock explicitly so the error message says *why*.
  if (new Date() < session.scheduledAt) {
    const error = new Error("Cannot complete a session that has not started yet");
    error.statusCode = 400;
    throw error;
  }

  const transitionGuard = Session.validateStatusTransition(
    session.status,
    Session.SESSION_STATUSES.COMPLETED
  );
  if (!transitionGuard.valid) {
    const error = new Error(transitionGuard.error);
    error.statusCode = 400;
    throw error;
  }

  session.status = Session.SESSION_STATUSES.COMPLETED;
  await session.save();

  emitSessionRoomUpdate(session);

  const updated = await Session.findById(session._id)
    .populate("match")
    .populate("participants", "name email")
    .populate("activity", "name")
    .populate("proposedBy", "name email");

  return successResponse(res, { session: updated }, "Session marked as completed successfully");
});

module.exports = {
  proposeSession,
  getSessions,
  getSessionHistory,
  getSessionById,
  acceptSession,
  rejectSession,
  cancelSession,
  completeSession,
};
