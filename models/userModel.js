const mongoose =require("mongoose")

const userschema=new mongoose.Schema({

    name:{

        type:String,
        required:true
    },

    email:{

        type:String,
        required:true
    },
    mobile:{
        type:String,
        required:true
    },

    image:{

        type:String,
        required:true
    },
    
    password:{
        type:String,
        required:true
    },
    
    is_admin:{
        type:Number,
        required:true
    },

    is_verified:{
        
        type:Number,
        default:0
    },
    
    otp: {
        type: String,
        default: null,
      },
      
      blocked:{
        type:Boolean,
        default:false
    },
    token:{
        type:String,
        default:''
    },
    coupons:[]
})

module.exports = mongoose.model('User',userschema)