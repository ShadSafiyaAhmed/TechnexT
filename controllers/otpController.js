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

  if(otps[userMobile]) {
    const {otp: storedOTP, timestamp} = otps[userMobile]
    const currentTime = Date.now();
    const expirationTime = timestamp + otpValidityDuration;
    const remainingTime = Math.max(0, Math.floor((expirationTime - currentTime) / 1000)); 

if (remainingTime <= 0) {
  res.render('otp', { message: 'OTP has expired. Please request a new one.', remainingTime: 0 });
  delete otps[userMobile];
  return;
}

res.render('otp', { message: '', remainingTime: remainingTime});
    if(otp === storedOTP) {
      console.log('You are Verified')
      await User.updateOne({ _id : req.session.user_id}, {otp : null, is_verified : 1})
      res.redirect('/home')
    }else{
      res.render('otp', {message : 'Invalid OTP. Please try again',remainingTime})
    }
    delete otps[userMobile]
  }else{
    res.render('otp', {message: 'OTP not found. Please request a new one'})
  }
  
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

