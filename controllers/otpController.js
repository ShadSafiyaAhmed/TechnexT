const twilio= require('twilio')
const config=require('../config/config')
const User = require('../models/userModel');
require('dotenv').config();

const accountSid = config.twilioAccountSid;
const authToken = config.twilioAuthToken;
const verifyServiceSid = config.verifyServiceSid
const client =twilio(accountSid,authToken)

const otps = {}
const otpValidityDuration = 60 * 1000

const sendOTP=async(phoneNumber)=>{
  try {

    const otp = generateOTP()
    const timestamp = Date.now()


    await client.verify.v2.services(verifyServiceSid).verifications.create({
      to:phoneNumber,
      channel:'sms'
    })
    otps[phoneNumber] = {otp, timestamp}
     console.log("otp sent")
  } catch (error) {
    console.log(error.message)
    throw new Error('Failed to Send OTP')
  }
}
const verifyOTP=async(req,res)=>{
  try {

    console.log('Verification start')
    const  userData= await User.findOne({_id:req.session.user_id})
    const userMobile=userData.mobile
    const otp=req.body.otp
    console.log("check ",userMobile,otp)

 
    client.verify.v2.services(verifyServiceSid).verificationChecks.create({to:userMobile,code:otp})
    .then(async(verification_check)=>{
     if(verification_check.status ==='approved'){
       console.log('you are verified',verification_check.status)
       await User.updateOne({ _id: req.session.user_id }, { otp: null,is_verified:1});
       res.redirect('/home')

     }
     else{

      res.render('otp', { message: 'Invalid OTP. Please try again.' });
     }
 
    });
    
  } catch (error) {
    
    console.log(error.message)
  
  }

}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}


module.exports={
  
  sendOTP,
  verifyOTP

}

