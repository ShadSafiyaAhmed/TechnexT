const express =require("express")
const multer = require("multer");
const admin_route=express()
const  config=require("../config/config")
const session =require ("express-session")
const nocache=require('nocache');
const multerConfig = require("../config/multerConfig");
const CategoryController=require('../controllers/categoryController')
const productController=require('../controllers/productController')
const cartController=require('../controllers/cartController')
const orderController=require('../controllers/orderController')
const profileController=require('../controllers/profileController')
const couponController=require('../controllers/couponController')

admin_route.use(session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: true
  }));

admin_route.use(nocache())

const bodyParser=require("body-parser")

admin_route.use(bodyParser.json())
admin_route.use(bodyParser.urlencoded({extended:true}))

admin_route.set('view engine','ejs')

admin_route.set('views','./views/admin')

const path=require("path")

const Adminauth=require('../middleware/adminAuth')

const adminController=require("../controllers/adminController");

admin_route.get('/', Adminauth.isLogout,adminController.loadLogin)

admin_route.post('/', adminController.verifyLogin)

admin_route.get('/home',Adminauth.isLogin,adminController.loadDashboard)

admin_route.get('/logout',Adminauth.isLogin,adminController.logout)

admin_route.get('/users',Adminauth.isLogin,adminController.usersListLoad)
admin_route.get('/delete-user',adminController.deleteuser)
admin_route.get('/blockingUser',adminController.blockingUser)
admin_route.get('/unblockuser',adminController.unblockuser)

admin_route.get('/addCategory',Adminauth.isLogin,CategoryController.LoadCategory)
admin_route.post('/addCategory',Adminauth.isLogin,CategoryController.addCategory)
admin_route.get('/unlistCategory',Adminauth.isLogin,CategoryController.unlistCategory)
admin_route.get('/listCategory',Adminauth.isLogin,CategoryController.listCategory)
admin_route.get('/deleteCategory',Adminauth.isLogin,CategoryController.deleteCategory)
admin_route.get('/editCategory',Adminauth.isLogin,CategoryController.editCategoryLoad)
admin_route.post('/editCategory',CategoryController.updateCategory)

admin_route.get('/addProduct',Adminauth.isLogin,productController.loadaddProduct)
admin_route.post('/addProduct',multerConfig.upload,productController.createProduct)

admin_route.get('/productsList',Adminauth.isLogin,productController.loadProductList)
admin_route.get('/editProduct',Adminauth.isLogin,productController.editproductLoad)
admin_route.post('/editProduct',multerConfig.upload,productController.updateProduct)
admin_route.get('/deleteProduct',productController.deleteProduct)
admin_route.get('/unlistProduct',productController.unlistProduct)
admin_route.get('/listedProduct',productController.listedProduct)

admin_route.get('/OrderList',Adminauth.isLogin,orderController.OrderList)
admin_route.get('/orderDetails',Adminauth.isLogin,orderController.orderDetails)
admin_route.get('/updateStatus',orderController. updateOrderStatus);
admin_route.get('/salesReport',Adminauth.isLogin,adminController.getSalesReport )
admin_route.get('/getTodaySales',Adminauth.isLogin,adminController.getSalesToday)
admin_route.get('/getWeekSales',Adminauth.isLogin,adminController.getWeekSales)
admin_route.get('/getMonthlySales',Adminauth.isLogin,adminController.getMonthSales)
admin_route.get('/getYearlySales',Adminauth.isLogin,adminController.getYearlySales)
admin_route.post('/salesReport',Adminauth.isLogin,adminController.postSalesReport)
admin_route.post('/salesWithDate',adminController.salesWithDate)
admin_route.get('/salesReportdwn',Adminauth.isLogin,adminController.downloadSalesReport)

admin_route.get('/acceptReturn',profileController.acceptReturn)
admin_route.get('/DeclineReturn',orderController.declineReturn)

admin_route.get('/loadCouponAdd', Adminauth.isLogin,adminController.loadCouponAdd )  
admin_route.get('/generate-coupon-code',adminController.generateCouponCode ) 
admin_route.post('/addCoupon',adminController.addCouponData ) 
admin_route.get('/couponList',adminController.couponList)

admin_route.get('/addBanner',adminController.loadAddBanner)
admin_route.post('/addBanner',multerConfig.uploadBnannerImage.single('image'),adminController.addNewBanner)
admin_route.get('/bannerList',adminController.showBanners)
admin_route.get('/unlistBanner',adminController.unlistBanner)
admin_route.get('/listBanner',adminController.listedBanner)
admin_route.get('/deleteBanner',adminController.deleteBanner)

//New coupon implementation
admin_route.get('/add-coupon',Adminauth.isLogin, couponController.addNewCouponGET);
admin_route.post('/add-coupon', Adminauth.isLogin,couponController.addNewCouponPOST);



admin_route.get('*',(req,res)=>{

  res.redirect('/admin')
})


module.exports=admin_route