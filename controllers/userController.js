const User = require("../models/userModel");
const Category = require("../models/CategoryModel");
const Product = require("../models/productsModel");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const config = require("../config/config");
const otpController = require("../controllers/otpController");
const Admin = require("../models/adminModel");
const Address = require("../models/addressModel");
const Order = require("../models/orderModel");
const randomstring = require("randomstring");
const userHelper = require("../helpers/userHelper");
const wishListHelper = require("../helpers/wishListHelper");

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

/* ========================Loading Register Page======================== */

const loadRegister = async (req, res) => {
  try {
    await userHelper.loadingRegister(req, res);
  } catch (error) {
    console.log(error.message);
  }
};
/* ========================Insert user======================== */

const insertuser = async (req, res) => {
  try {
    await userHelper.insertingUser(req, res);
  } catch (error) {
    console.log(error.message);
  }
};

/* ========================Login Login Page======================== */

const loginLoad = async (req, res) => {
  try {
    await userHelper.loginPageLoad(req, res);
  } catch (error) {
    console.log(error.message);
    res.redirect("/user-error");
  }
};
/* ========================Loading otp page======================== */

const LoadVerifyOtp = async (req, res) => {
  try {
    userHelper.loadingVerifyOtp(req, res);
  } catch (error) {
    console.log(error.message);
  }
};

/* ========================Verification for Login======================== */

const verifyLogin = async (req, res) => {
  try {
    await userHelper.verifyToLogin(req, res);
  } catch (error) {
    console.log(error.message);
  }
};

/* ========================Forget Password======================== */

const forgetVerify = async (req, res) => {
  try {
    await userHelper.forgotPasswordVerify(req, res);
  } catch (error) {
    console.log(error.message);
  }
};

/* ========================for got passoword================= */
const forgetPasswordLoad = async (req, res) => {
  try {
    await userHelper.forgetPasswordLoad(req, res);
  } catch (error) {
    console.log(error.message);
    res.redirect("/user-error");
  }
};
/* ========================Reset======================== */
const resetPassword = async (req, res) => {
  try {
    await userHelper.resettingPassword(req, res);
  } catch (error) {
    console.log(error.message);
    res.redirect("/user-error");
  }
};
/* ========================User Logout======================== */

const userLogout = async (req, res) => {
  try {
    await userHelper.logoutUser(req, res);
  } catch (error) {
    console.log(error.message);
  }
};

/* ========================Index page Controller======================== */

const loadindex = async (req, res) => {
  try {
    await userHelper.loadingIndexPage(req, res);
  } catch (error) {
    console.log(error.message);
    res.redirect("/user-error");
  }
};

/* ========================HOME Page Controller======================== */

const loadHome = async (req, res) => {
  try {
    await userHelper.loadingUserhome(req, res);
  } catch (error) {
    res.redirect("/user-error");

    console.log(error.message);
  }
};
/* ========================Loading Error page======================== */

const errorMessage = async (req, res) => {
  try {
    await userHelper.loadingErrorPage(req, res);
  } catch (error) {}
};
/* =====================Shop Controller======================== */

const viewShop = async (req, res) => {
  try {
    await userHelper.loadingShop(req, res);
  } catch (error) {
    console.log(error.message);
    res.redirect("/user-error");
  }
};

/* ===================Single product  Controller============== */

const loadProductDetails = async (req, res) => {
  try {
    await userHelper.singleProductView(req, res);
  } catch (error) {
    console.log(error.message);
  }
};

/* ========================user MyAccount======================== */

const loadmyAccount = async (req, res) => {
  try {
    await userHelper.loadingMyAccount(req, res);
  } catch (error) {
    console.log(error.message);
  }
};

/* ========================Add Address ======================== */

const addAddress = async (req, res) => {
  try {
    await userHelper.addingAddress(req, res);
  } catch (error) {
    console.log(error.message);
  }
};
/* ========================Edit Address ======================== */
const editAddress = async (req, res) => {
  console.log("ivdeeeeeeeeeee");

  const id = req.body.id;
  const name = req.body.name;
  const mobile=req.body.mobileNumber
  const address = req.body.address;
  const city = req.body.city;
  const street=req.body.street
  const pincode = req.body.pincode;

  const mobileNumber = req.body.mobileNumber;



  const update = await Address.updateOne(
    { "address._id": id }, // Match the document with the given ID
    {
      $set: {
        "address.$.name": name,
        "address.$.mobile":mobile,
        "address.$.homeAddress": address,
        "address.$.city": city,
        "address.$.street":street,
        "address.$.postalCode": pincode,
        "address.$.mobileNumber": mobileNumber,
      },
    }
  );

  res.redirect("/userAddress");
};

/* ========================Delete Address ======================== */

const deleteAddress = async (req, res) => {
  try {
    await userHelper.deletingAddress(req, res);
  } catch (error) {
    console.log(error.message);
  }
};

/* ============ Order Sucess ========================= */
const orderSuccess = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const userData = await User.findById({ _id: req.session.user_id });
    const wishlistCount = await wishListHelper.getWishListCount(
      req.session.user_id
    );

    const orders = await Order.find({ user: userId }).exec();

    res.render("Ordersuccess", {
      user: userData,
      orders: orders,
      wishlistCount: wishlistCount,
    });
  } catch (error) {
    console.log(error.message);
  }
};

/* ============ Order failed ========================= */

const orderFailed = async (req, res) => {
  try {
    const wishlistCount = await wishListHelper.getWishListCount(
      req.session.user_id
    );
    const userData = await User.findById({ _id: req.session.user_id });

    res.render("orderFailed", { user: userData, wishlistCount });
  } catch (error) {
    console.log(error.message);
  }
};

/* ================new Account ========================= */

const accountLoad = async (req, res) => {
  try {
    await userHelper.loadingNewaccount(req, res);
  } catch (error) {
    console.log(error.message);
  }
};

/* ====================Load About Page==================== */
const loadAboutPage = async (req, res) => {
  try {
    const userData = req.session.user_id
      ? await User.findById(req.session.user_id)
      : null;
    const wishlistCount = await wishListHelper.getWishListCount(
      req.session.user_id
    );
    res.render("about", { wishlistCount, user: userData });
  } catch (error) {
    console.log(error.message);
  }
};

//editPassword
const editPassword = async (req, res) => {
  try {
    await userHelper.changinguserPassword(req, res);
  } catch (error) {
    console.log(error.message);
  }
};

const userAddress = async (req, res) => {
  try {
    await userHelper.loadingUserAdress(req, res);
  } catch (error) {
    console.log(error.messge);
    res.redirect('/user-error')
  }
};  

const couponLoad = async (req, res) => {
  try {
    await userHelper.loadingCoupons(req, res);
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  loadRegister,
  insertuser,
  loginLoad,
  verifyLogin,
  loadHome,
  userLogout,
  loadProductDetails,
  loadindex,
  loadmyAccount,
  addAddress,
  deleteAddress,
  orderSuccess,
  viewShop,
  errorMessage,
  accountLoad,
  userAddress,
  editPassword,
  securePassword,
  orderFailed,
  forgetVerify,
  forgetPasswordLoad,
  resetPassword,
  couponLoad,
  LoadVerifyOtp,
  editAddress,
  loadAboutPage,
};
