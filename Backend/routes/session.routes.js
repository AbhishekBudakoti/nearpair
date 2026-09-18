const express = require("express");
const {
  proposeSession,
  getSessions,
  getSessionHistory,
  getSessionById,
  acceptSession,
  rejectSession,
  cancelSession,
  completeSession,
} = require("../controllers/session.controller");
const { protect } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/", protect, proposeSession);
router.get("/", protect, getSessions);

// Literal path stays above "/:id" so it's never read as a session id.
router.get("/history", protect, getSessionHistory);

router.get("/:id", protect, getSessionById);
router.patch("/:id/accept", protect, acceptSession);
router.patch("/:id/reject", protect, rejectSession);
router.patch("/:id/cancel", protect, cancelSession);
router.patch("/:id/complete", protect, completeSession);

module.exports = router;
