
const Profile = require('../models/profile.model')
const Activity = require('../models/activity.model')

const {successResponse}=require('../utils/response')
const {buildLocation}=require('../utils/geo')

// Avatars are client-resized data URLs (~10-25KB typical); this caps well
// above that so a normal photo always fits while rejecting a client that
// skips the resize step and sends a full-size image or something else huge.
const MAX_AVATAR_LENGTH = 300000;

const validateAvatar = (avatar) => {
    if (avatar === undefined || avatar === null || avatar === "") return;

    if (typeof avatar !== "string" || !avatar.startsWith("data:image/")) {
        const error = new Error("Avatar must be an image");
        error.statusCode = 400;
        throw error;
    }

    if (avatar.length > MAX_AVATAR_LENGTH) {
        const error = new Error("Avatar image is too large");
        error.statusCode = 400;
        throw error;
    }
};

const SKILL_LEVELS = ["beginner", "intermediate", "advanced"];

const validateSkills = async (skills) => {
    if (!skills?.length) return;

    const activityIds = skills.map((s) => s?.activity);

    const invalidLevel = skills.some((s) => !SKILL_LEVELS.includes(s?.level));
    if (invalidLevel) {
        const error = new Error("One or more skill levels are invalid");
        error.statusCode = 400;
        throw error;
    }

    const uniqueActivityIds = new Set(activityIds.map(String));
    if (uniqueActivityIds.size !== activityIds.length) {
        const error = new Error("Each activity can only be added once");
        error.statusCode = 400;
        throw error;
    }

    const validActivities = await Activity.countDocuments({
        _id: { $in: activityIds },
        isActive: true,
    });

    if (validActivities !== activityIds.length) {
        const error = new Error("One or more activities are invalid");
        error.statusCode = 400;
        throw error;
    }
};


const createProfile = async(req,res) =>{
    const {avatar,bio,skills,
    availability,
    location,} = req.body;

    validateAvatar(avatar);
    await validateSkills(skills);

    const existingProfile = await Profile.findOne({ user:req.user.id})

    if(existingProfile){
        const error = new Error("Profile already exists")
        error.statusCode=400
        throw error;
    }

    const profile = await Profile.create({
        user:req.user.id,
        avatar,
           bio,
    skills,
    availability,
    location: buildLocation(location),
    })



    await profile.populate("skills.activity");

    return successResponse(res,{profile},"Profile created successfully",201)
}


const getMyProfile = async (req,res) =>{
    const profile = await Profile.findOne({user:req.user.id})
    .populate("user","name email role")
    .populate("skills.activity");

    if(!profile){
        const error=new Error("Profile not found")
        error.statusCode=404;
        throw error;
    }

    return successResponse(
        res,{profile},"Profile fetched Successfully"
    );
}


const updateMyProfile = async (req,res) =>{

    const {  avatar,
    bio,
    skills,
    availability,
    location } = req.body;

    validateAvatar(avatar);
    await validateSkills(skills);

    const profile=await Profile.findOne({ user:req.user.id})


    if(!profile){
        const error = new Error("Profile not found");
        error.statusCode=404;
        throw error;
    }

    if(skills !== undefined) profile.skills = skills;

     if (avatar !== undefined) profile.avatar = avatar;
     if (bio !== undefined) profile.bio = bio;
  if (availability !== undefined) profile.availability = availability;
    if (location !== undefined) profile.location = buildLocation(location, profile.location?.point);

    await profile.save();

    await profile.populate("skills.activity");

    return successResponse(res,{profile},"profile updated successfully")

}


const getCities = async (req, res) => {
  const rawCities = await Profile.distinct("location.city", {
    "location.city": { $exists: true, $ne: "" },
  });
  const cities = rawCities
    .map((c) => (typeof c === "string" ? c.trim() : ""))
    .filter(Boolean)
    .sort();
  return successResponse(res, { cities }, "Cities fetched successfully");
};

const getUserProfile = async (req, res) => {
  const { userId } = req.params;
  const profile = await Profile.findOne({ user: userId })
    .populate("user", "name email role createdAt")
    .populate("skills.activity");

  if (!profile) {
    const User = require("../models/user.model");
    const user = await User.findById(userId).select("name email role createdAt");
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }
    return successResponse(
      res,
      {
        profile: {
          user,
          avatar: "",
          bio: "No bio provided yet.",
          skills: [],
          location: { city: "Not specified" },
          availability: [],
        },
      },
      "User profile fetched successfully"
    );
  }

  return successResponse(res, { profile }, "User profile fetched successfully");
};

module.exports = {
  createProfile,
  getMyProfile,
  updateMyProfile,
  getCities,
  getUserProfile,
};