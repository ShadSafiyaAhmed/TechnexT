const express = require("express");
const session = require('express-session');
const config = require("../config/config");
const auth = require("../middleware/auth");
const bodyParser = require('body-parser');
const nocache=require('nocache');
const multer = require("multer");
const path = require("path");
const userController = require('../controllers/userController');
const otpController=require('../controllers/otpController')
const multerConfig = require("../config/multerConfig");
const cartController=require('../controllers/cartController')
const orderController=require('../controllers/orderController')
const profileController=require('../controllers/profileController')
const wishListController=require('../controllers/wishListController')
const couponController=require('../controllers/couponController')


const user_route = express();

user_route.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: true
}));

user_route.use(nocache())

user_route.set('view engine', 'ejs');
user_route.set('views', './views/users');

user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({ extended: true }));

user_route.use(express.static('public'))

user_route.get('/',auth.isLogout,userController.loadindex);
user_route.get('/index',  userController.loadindex);
user_route.get('/about',userController.loadAboutPage)
user_route.get('/register', auth.isLogout, userController.loadRegister);
user_route.post('/register', multerConfig.uploadUserImage.single('image'), userController.insertuser);

user_route.get('/login', auth.isLogout,userController.loginLoad); 
user_route.post('/login',auth.isLogout, userController.verifyLogin);
user_route.get('/logout',auth.isLogin,userController.userLogout)

user_route.get('/otp',userController.LoadVerifyOtp)
user_route.post('/otp-verify',otpController.verifyOTP);
user_route.get('/home',auth.isLogin,userController.loadHome);
user_route.get('/shop',userController.viewShop)
user_route.get('/productDetails',userController.loadProductDetails)

user_route.get('/user-error',userController.errorMessage)
user_route.get('/account',userController.accountLoad)
user_route.post('/editInfo',profileController.editInfo) 
user_route.post('/editPassword',profileController.editPassword) 



user_route.get('/userCart',cartController.loadCart)
user_route.post('/add-cart/:id',auth.isLogin,cartController.addCart)
user_route.post('/updateQuantity',cartController.updateQuantity)
user_route.post('/removeCartItem',cartController.removeCartItem)


user_route.get('/myAccount',auth.isLogin,userController.loadmyAccount)
user_route.get('/checkout',cartController.checkoutLoad)
user_route.post('/placeOrder',orderController.placeOrder)
user_route.get('/userAddress',userController.userAddress)
user_route.post('/addAddress',userController.addAddress)
user_route.post('/updateAddress',userController.editAddress)
user_route.get('/deleteAddress',userController.deleteAddress)
user_route.get('/orderSuccessful',userController.orderSuccess)
user_route.get('/orderFailed',userController.orderFailed)
user_route.get('/cancelOrderPage', auth.isLogin, orderController.renderCancelOrderPage);
user_route.get('/cancelOrder',auth.isLogin,orderController.cancelOrder)
user_route.post('/cancelOrder', auth.isLogin, orderController.cancelOrder);

user_route.get('/requestReturn', orderController.requestReturn);
user_route.get('/returnOrder', orderController.returnOrderForm)
user_route.post('/requestReturn', orderController.requestReturn)
user_route.post('/verify-payment',orderController.verifyPayment)
user_route.get('/orderDetails', orderController.viewOrderDetail);
user_route.get('/downloadInvoice/:orderId',orderController.invoiceDownload)

user_route.get('/Coupons',userController.couponLoad) 
user_route.get('/category/:category', userController.loadHome);


user_route.get('/profileOrderList',profileController.userOrderList)
user_route.get('/wallet-placed',orderController.walletOrder)
user_route.post('/forget',userController.forgetVerify)
user_route.get('/forget-password',auth.isLogout,userController.forgetPasswordLoad);
user_route.post('/forget-password',userController.resetPassword);


user_route.get('/wishList',wishListController.loadWishList)
user_route.post('/add-to-wishlist',auth.isLogin,wishListController.addWishList)
user_route.delete('/remove-product-wishlist',wishListController.removeProductWishlist) 
user_route.get('/viewOrder',profileController.loadOrderSlip)
user_route.post('/apply-coupon-request', couponController.applyCouponPOST);



module.exports = user_route;
       