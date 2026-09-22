const mongoose=require('mongoose')

const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:[true,"Name is required"],
        trim:true,
        minlength:[2,"Name must be at least two characters"],
        maxlength:[50,"Name cannot exceed 50 characters"]

    },
    email:{
        type:String,
        required:[true,"Email is required"],
        unique:true,
        lowercase:true,
        trim:true
    },
    password:{
        type:String,
        // Not required for a Google-only account (no password ever set).
        required:[function(){ return !this.googleId; },"Password is required"],
        minlength:[6,"Password must at least 6 characters"]
    },
    // No default: a sparse unique index only excludes documents where the
    // field is truly absent, not ones explicitly set to null — so a
    // password-only user must simply never have this key at all.
    googleId:{
        type:String,
        unique:true,
        sparse:true
    },
    gender:{
        type:String,
        enum:["male","female","other","prefer_not_to_say"]
    },
    dateOfBirth:{
        type:Date
    },
    phone:{
        type:String,
        trim:true,
        default:""
    },
    referralCode:{
        type:String,
        trim:true,
        default:""
    },
    role:{
        type:String,
        enum:["user","admin"],
        default:"user"
    },
    isVerified:{
        type:Boolean,
        default:false
    },
    // --- Moderation ---
    isSuspended:{
        type:Boolean,
        default:false
    },
    // null while suspended = permanent suspension
    suspendedUntil:{
        type:Date,
        default:null
    },
    suspensionReason:{
        type:String,
        default:""
    },
    warningsCount:{
        type:Number,
        min:0,
        default:0
    }
},{timestamps:true})

const User=mongoose.model("User",userSchema)

module.exports=User;