const mongoose = require("mongoose");

const Profile = require("../models/profile.model");
const { successResponse } = require("../utils/response");
const { getHiddenUserIds } = require("../services/block.service");

const searchPartners = async (req, res) => {
  const {
    activity,
    skillLevel,
    day,
    startTime,
    endTime,
  } = req.query;

  // Blocked users (either direction) and suspended users never show up.
  const hiddenUserIds = await getHiddenUserIds(req.user.id);

  const filter = {
    user: {
      $nin: [req.user.id, ...hiddenUserIds],
    },
  };

  // Filter by activity
  if (activity) {
    if (!mongoose.Types.ObjectId.isValid(activity)) {
      const error = new Error("Invalid activity ID");
      error.statusCode = 400;
      throw error;
    }
  }

  // Filter by skill level
  if (skillLevel) {
    const allowedSkillLevels = [
      "beginner",
      "intermediate",
      "advanced",
    ];

    if (!allowedSkillLevels.includes(skillLevel)) {
      const error = new Error("Invalid skill level");
      error.statusCode = 400;
      throw error;
    }
  }

  // Both given: the SAME skill entry must have this activity at this level.
  // Either alone: match any skill entry with that activity, or that level.
  if (activity && skillLevel) {
    filter.skills = {
      $elemMatch: { activity: new mongoose.Types.ObjectId(activity), level: skillLevel },
    };
  } else if (activity) {
    filter["skills.activity"] = activity;
  } else if (skillLevel) {
    filter["skills.level"] = skillLevel;
  }

  // Filter by availability
  if (day) {
    const allowedDays = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];

    if (!allowedDays.includes(String(day).toLowerCase())) {
      const error = new Error("Invalid day");
      error.statusCode = 400;
      throw error;
    }

    const availabilityFilter = {
      day,
    };

    if (startTime && endTime) {
      availabilityFilter.startTime = {
        $lte: startTime,
      };

      availabilityFilter.endTime = {
        $gte: endTime,
      };
    }

    filter.availability = {
      $elemMatch: availabilityFilter,
    };
  }

  const profiles = await Profile.find(filter)
    .populate("user", "name email")
    .populate("skills.activity", "name")
    .sort({ createdAt: -1 });

  return successResponse(
    res,
    {
      count: profiles.length,
      profiles,
    },
    "Partners fetched successfully"
  );
};

module.exports = {
  searchPartners,
};