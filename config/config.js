const config = require('../config/config')



    const sessionSecret = process.env.SESSION_SECRET
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER
    const verifyServiceSid = process.env.TWILIO_VERIFY_SID


    module.exports={   
        twilioAccountSid,
        twilioAuthToken,
        twilioPhoneNumber,
        verifyServiceSid,
        sessionSecret,
    

    }