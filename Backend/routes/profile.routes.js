const express = require('express')

const { getMyProfile, updateMyProfile, createProfile, getCities, getUserProfile } = require("../controllers/profile.controller");

const asyncHandler = require("../middlewares/asyncHandler");
const { protect } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(protect);

router.get("/cities", asyncHandler(getCities));
router.post("/", asyncHandler(createProfile));
router.get("/me", asyncHandler(getMyProfile));
router.patch("/me", asyncHandler(updateMyProfile));
router.get("/user/:userId", asyncHandler(getUserProfile));

module.exports = router;