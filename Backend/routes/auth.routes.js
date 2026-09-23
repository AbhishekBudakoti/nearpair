const express=require('express');
const {register,login,googleLogin,getCurrentUser,logout,getSocketToken}=require("../controllers/auth.controller")

const asyncHandler=require("../middlewares/asyncHandler")
const { protect } = require('../middlewares/auth.middleware')

const router=express.Router();


router.post("/register",asyncHandler(register))
router.post("/login",asyncHandler(login))
router.post("/google",asyncHandler(googleLogin))
router.get("/me", protect, asyncHandler(getCurrentUser))
router.get("/socket-token", protect, asyncHandler(getSocketToken))
router.post("/logout",asyncHandler(logout))


module.exports=router