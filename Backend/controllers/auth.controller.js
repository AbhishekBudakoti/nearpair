const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const User = require('../models/user.model');
const { successResponse } = require('../utils/response');
const { getActiveSuspension, buildSuspendedError } = require('../services/moderation.service');

// Mirrors Frontend/src/utils/password.js's checkPasswordStrength — keep the
// two in sync if the policy ever changes.
const STRONG_PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const GENDERS = ["male", "female", "other", "prefer_not_to_say"];

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

// Shared by login() and googleLogin() — issues the same httpOnly session
// cookie regardless of how the user authenticated.
const issueAuthCookie = (res, user) => {
    const JWT_SECRET = process.env.JWT_SECRET || process.env.JWT_SECRETS || 'dev-secret-key';

    const token = jwt.sign(
        {
            id: user._id,
            role: user.role
        },
        JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || '7d'
        }
    );

    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });
};

//Register user
const register=async(req,res)=>{
    let {name,email,password,gender,dateOfBirth,phone,referralCode}=req.body;

    // Validate required fields
    if(!name||!email||!password){
        const error=new Error("Name, email and password are required")

        error.statusCode=400;
        throw error;
    }

    if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
        const error = new Error("Name, email and password must be text");
        error.statusCode = 400;
        throw error;
    }

    if (!STRONG_PASSWORD_RE.test(password)) {
        const error = new Error(
            "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character"
        );
        error.statusCode = 400;
        throw error;
    }

    // The rest are optional — only validate them if the caller sent one.
    if (gender !== undefined && gender !== "" && !GENDERS.includes(gender)) {
        const error = new Error("Invalid gender");
        error.statusCode = 400;
        throw error;
    }

    let parsedDob;
    if (dateOfBirth !== undefined && dateOfBirth !== "") {
        parsedDob = new Date(dateOfBirth);
        if (Number.isNaN(parsedDob.getTime()) || parsedDob > new Date()) {
            const error = new Error("Invalid date of birth");
            error.statusCode = 400;
            throw error;
        }
    }

    email = email.toLowerCase().trim();

  // Check existing user
  const existingUser= await User.findOne({email});
  if(existingUser){
    const error=new Error("User with this email already exist")
    error.statusCode = 409;
    throw error
  }

  const hashedPassword= await bcrypt.hash(password,10)

    // Create user
    const user=await User.create({
        name,
        email,
        password:hashedPassword,
        gender: gender || undefined,
        dateOfBirth: parsedDob,
        phone: phone || "",
        referralCode: referralCode || "",
    });

    return successResponse(
        res,{
            user:{
                id:user._id,
                name:user.name,
                email:user.email,
                role:user.role,
            },
        },
        "User Register Successfully",
        201
    )

}


//login user
const login=async(req,res)=>{
    let {email,password}=req.body;

    if(!email||!password){
        const error=new Error("Enter the username and password")
        error.statusCode=400;
        throw error;
    }

    if (typeof email !== "string" || typeof password !== "string") {
        const error = new Error("Enter the username and password");
        error.statusCode = 400;
        throw error;
    }

    email = email.toLowerCase().trim();

    const user=await User.findOne({email})

    if(!user){
        const error=new Error("Invalid Username and Password")
        error.statusCode=400;
        throw error;

    }

    // A Google-only account (googleId set, no password ever chosen) can't be
    // compared against with bcrypt — bcrypt.compare throws on a missing hash
    // instead of just returning false, so this must be checked first.
    if (!user.password) {
        const error = new Error("This account signs in with Google — use \"Continue with Google\" instead");
        error.statusCode = 400;
        throw error;
    }

    const isPasswordValid = await bcrypt.compare(password,user.password)

    if(!isPasswordValid){

              const error=new Error("Invalid Username and Password")
        error.statusCode=400;
        throw error;

    }

    // Checked only after the password matches, so suspension status isn't
    // revealed to someone guessing at an email address.
    const suspension = await getActiveSuspension(user);
    if (suspension) {
        throw buildSuspendedError(suspension);
    }

    issueAuthCookie(res, user);

    return successResponse(res,{
        user:{
              id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        },
    },
 "Login successful");
};


// Google Identity Services sends an ID token ("credential") after the user
// picks an account in the Google button/prompt; we verify it server-side and
// treat it exactly like a password login from there — same cookie, same
// suspension check, same response shape.
const googleLogin = async (req, res) => {
    const { credential } = req.body;

    if (!credential || typeof credential !== "string") {
        const error = new Error("Google credential is required");
        error.statusCode = 400;
        throw error;
    }

    if (!googleClient) {
        const error = new Error("Google sign-in is not configured");
        error.statusCode = 500;
        throw error;
    }

    let payload;
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: GOOGLE_CLIENT_ID,
        });
        payload = ticket.getPayload();
    } catch {
        const error = new Error("Invalid Google credential");
        error.statusCode = 400;
        throw error;
    }

    if (!payload?.email || !payload.email_verified) {
        const error = new Error("Google account email is not verified");
        error.statusCode = 400;
        throw error;
    }

    const email = payload.email.toLowerCase().trim();

    let user = await User.findOne({ googleId: payload.sub });

    if (!user) {
        user = await User.findOne({ email });
        if (user) {
            // Google already verified this email, so it's safe to attach the
            // Google id to the existing password account rather than reject.
            user.googleId = payload.sub;
            await user.save();
        } else {
            user = await User.create({
                name: payload.name || email.split("@")[0],
                email,
                googleId: payload.sub,
                isVerified: true,
            });
        }
    }

    const suspension = await getActiveSuspension(user);
    if (suspension) {
        throw buildSuspendedError(suspension);
    }

    issueAuthCookie(res, user);

    return successResponse(
        res,
        {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        },
        "Login successful"
    );
};


//current user

const getCurrentUser= async (req,res)=>{

    const user= await User.findById(req.user.id).select(
        "-password"
    );

     if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return successResponse(
    res,
    {
      user,
    },
    "Current user fetched successfully"
  );
};

//logout user

const logout=async(req,res)=>{
    res.clearCookie("token",{
        httpOnly:true,
        secure:process.env.NODE_ENV==="production",
        sameSite:process.env.NODE_ENV==="production"?"none":"lax"
    })

    return successResponse(
        res,
        {},
        "Logout Successful"
    )
}




module.exports={
    register,login,googleLogin,getCurrentUser,logout
}