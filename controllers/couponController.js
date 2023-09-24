
const User = require('../models/userModel');
const Product = require('../models/productsModel');
const couponHelpers = require('../helpers/couponHelper')
const Coupon = require('../models/newCouponModel')
const UsedCoupon = require('../models/usedCouponModel.js')
const orderHelper = require('../helpers/orderHelper')
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;



const addNewCouponGET = async(req,res)=>{
    try {
        const admin = req.session.is_admin;
        const adminData = await User.find({is_admin:admin})

        let couponExistError = false;

        if(req.session.couponExistError){

            couponExistError = req.session.couponExistError;
            
        }
  
        res.render('coupon-add',{  adminData, couponExistError });

        delete req.session.couponExistError;
    } catch (error) {
        console.log("Error from addNewCouponGET couponController :", error.message);
        
       
    }
}


const   addNewCouponPOST = async(req,res)=>{
    try {
        const admin = req.session.is_admin;
        const adminData = await User.find({is_admin:admin})

        const newCouponData = req.body;
    
        const couponExist = await couponHelpers.verifyCouponExist(newCouponData);

        if(couponExist.status){
            const couponAddingStatus = await couponHelpers.addNewCoupon(newCouponData);
            
    
                res.redirect('add-coupon');
    
        }else if (couponExist.duplicateCoupon){
    
            req.session.couponExistError = "Coupon code already exist, try some other code"

            res.redirect('add-coupon');
    
        }
    } catch (error) {
        console.log(error.message)
    }
}

const applyCouponPOST = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const couponCode = req.body.couponCode.toLowerCase();
        const couponData = await couponHelpers.getCouponDataByCouponCode(couponCode);
        const couponEligible = await couponHelpers.verifyCouponEligibility(couponCode);

        if (couponEligible.status) {
            const cartValue = await orderHelper.getCartValue(userId);

            if (cartValue >= couponData.minOrderValue) {
                const userEligible = await couponHelpers.verifyCouponUsedStatus(userId, couponData._id);

                if (userEligible.status) {
                    const applyNewCoupon = await couponHelpers.applyCouponToCart(userId, couponData._id);

                    if (applyNewCoupon.status) {
                        // Send JSON response with success message
                        res.json({ success: true, message: "Congrats, Coupon applied successfully" });
                        return; // Return to prevent further execution
                    } else {
                        // Send JSON response with error message
                        res.json({ success: false, message: "Sorry, Unexpected Error in applying coupon" });
                    }
                } else {
                    // Send JSON response with error message
                    res.json({ success: false, message: "Coupon already used earlier" });
                }
            } else {
                // Send JSON response with error message
                res.json({ success: false, message: `Coupon not applied, purchase minimum for ₹${couponData.minOrderValue} to get coupon` });
            }
        } else if (couponEligible.reasonForRejection) {
            // Send JSON response with error message
            res.json({ success: false, message: couponEligible.reasonForRejection });
        }
    } catch (error) {
        console.log("Error-3 from changeCouponStatusPOST couponController:", error.message);
        // Send JSON response with error message
        res.json({ success: false, message: "An error occurred while applying the coupon" });
    }
};




module.exports={

addNewCouponGET,
addNewCouponPOST,
applyCouponPOST

}