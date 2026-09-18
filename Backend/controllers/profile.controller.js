
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


const createProfile = async(req,res) =>{
    const {avatar,bio,activities,skillLevel,
    availability,
    location,} = req.body;

    validateAvatar(avatar);

    const existingProfile = await Profile.findOne({ user:req.user.id})

    if(existingProfile){
        const error = new Error("Profile already exists")
        error.statusCode=400
        throw error;
    }

    if(activities?.length){
        const validActivities =await Activity.countDocuments({
            _id:{$in:activities},
            isActive:true
        })

        if(validActivities !== activities.length){
            const error = new Error ("One or more activities are invalid")
            error.statusCode=400
            throw error;
        }
    }

    const profile = await Profile.create({
        user:req.user.id,
        avatar,
           bio,
    activities,
    skillLevel,
    availability,
    location: buildLocation(location),
    })



    await profile.populate("activities");

    return successResponse(res,{profile},"Profile created successfully",201)
}


const getMyProfile = async (req,res) =>{
    const profile = await Profile.findOne({user:req.user.id})
    .populate("user","name email role")
    .populate("activities");

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
    activities,
    skillLevel,
    availability,
    location } = req.body;

    validateAvatar(avatar);

    const profile=await Profile.findOne({ user:req.user.id})


    if(!profile){
        const error = new Error("Profile not found");
        error.statusCode=404;
        throw error;
    }

    if(activities){
        const  validActivities = await Activity.countDocuments({
            _id:{$in: activities},
            isActive:true
        })

        if(validActivities !== activities.length){
            const error = new Error ("One or more activities are invalid")
            error.statusCode=400
            throw error;
        }

        profile.activities=activities
    }

     if (avatar !== undefined) profile.avatar = avatar;
     if (bio !== undefined) profile.bio = bio;
       if (skillLevel !== undefined) profile.skillLevel = skillLevel;
  if (availability !== undefined) profile.availability = availability;
    if (location !== undefined) profile.location = buildLocation(location, profile.location?.point);

    await profile.save();

    await profile.populate("activities");

    return successResponse(res,{profile},"profile updated successfully")

}


module.exports = {
  createProfile,
  getMyProfile,
  updateMyProfile,
};