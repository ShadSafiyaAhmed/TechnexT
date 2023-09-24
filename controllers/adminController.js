const Admin = require("../models/adminModel");
const user = require("../models/userModel");
const Product = require("../models/productsModel");
const Order = require("../models/orderModel");
const couponHelper = require("../helpers/couponHelper");
const adminHelper = require("../helpers/adminHelper");
const Category = require('../models/CategoryModel')
const banner = require("../models/bannerModel");
const newCoupons = require("../models/newCouponModel");
const bcrypt = require("bcryptjs");
const moment = require('moment')
const auth = require("../middleware/auth");
const session = require("express-session");

path = require("path");

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

const loadLogin = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.log(error.message);
  }
};

const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const adminData = await Admin.findOne({ email: email });

    if (adminData) {
      const passwordMatch = await bcrypt.compare(password, adminData.password);

      if (passwordMatch) {
        if (adminData.is_admin === 0) {
          res.render("/admin/login", {
            message: "Email or Password is incorrect",
          });
        } else {
          req.session.admin = adminData._id;

          res.redirect("/admin/home");
        }
      } else {
        res.render("login", { message: "Email and Password is incorrect" });
      }
    } else {
      res.render("login", { message: "Email and Password is incorrect" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const calculateTotalRevenue = async () => {
  try {
    const placedOrders = await Order.find({ status: 'Delivered' }); 
    let totalRevenue = 0;

    placedOrders.forEach((order) => {
      totalRevenue += order.total;
    });

    return totalRevenue;
  } catch (error) {
    console.log(error.message);
    return 0; 
  }
};

const calculateTotalPlacedOrders = async () => {
    try {
      const placedOrdersCount = await Order.countDocuments({ status: 'Delivered' });
      return placedOrdersCount;
    } catch (error) {
      console.log(error.message);
      return 0;
    }
  };

  const calculateTotalProducts = async () => {
    try {
      const totalProducts = await Product.countDocuments();
      return totalProducts;
    } catch (error) {
      console.log(error.message);
      return 0; 
    }
  };

const calculateTotalCategories = async () => {
  try {
    const totalCategories = await Category.countDocuments();
    return totalCategories;
  } catch (error) {
    console.log(error.message);
    return 0;
  }
};

const calculateMonthlyEarnings  = async (startDate, endDate) => {
    try {
      const totalRevenue = await Order.aggregate([
        {
          $match: {
            createdAt: {
              $gte: startDate,
              $lte: endDate,
            },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$total' },
          },
        },
      ]);
  
      return totalRevenue.length > 0 ? totalRevenue[0].totalRevenue : 0;
    } catch (error) {
      console.log(error.message);
      return 0; // Handle error gracefully
    }
  };

  const calculateWeeklySalesData = async () => {
    try {
        // Get the current date and subtract 6 days to calculate the date range (1 week)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 6);

        // Initialize an array to hold daily sales
        const dailySales = Array(7).fill(0);

        // Fetch orders within the date range
        const orders = await Order.find({
            createdAt: { $gte: startDate, $lte: endDate }
        });

        // Calculate daily sales by iterating through orders
        orders.forEach(order => {
            const orderDate = new Date(order.createdAt);
            const dayOfWeek = orderDate.getDay(); // 0 for Sunday, 1 for Monday, etc.
            dailySales[dayOfWeek] += order.total; // Assuming 'total' represents the order amount
        });

        // Construct the daily sales data object
        const dailyData = {
            labels: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            sales: dailySales,
        };

        return dailyData;
    } catch (error) {
        console.log(error.message);
        return { labels: [], sales: [] }; // Handle error gracefully
    }
};


const calculateMonthlySalesData = async () => {
    try {
        // Initialize an array to hold weekly sales
        const weeklySales = [];
        const labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5']; // Labels for the five weeks

        // Get the current date
        const currentDate = new Date();
        
        // Calculate the start date (current month's first day) and end date (current month's last day)
        const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        // Set the start of the first week
        let weekStartDate = new Date(startDate);

        // Loop through the weeks
        for (let i = 0; i < 5; i++) {
            // Calculate the end of the week (7 days from the start)
            let weekEndDate = new Date(weekStartDate);
            weekEndDate.setDate(weekEndDate.getDate() + 6);

            // Query orders within the date range for this week
            const orders = await Order.find({
                createdAt: { $gte: weekStartDate, $lte: weekEndDate }
            });

            // Calculate total sales for the week
            const totalSales = orders.reduce((total, order) => total + order.total, 0);

            // Push total sales for the week
            weeklySales.push(totalSales);

            // Move to the start of the next week
            weekStartDate.setDate(weekEndDate.getDate() + 1);
        }

        // Construct the weekly sales data object
        const weeklyData = {
            labels: labels,
            sales: weeklySales,
        };

        return weeklyData;
    } catch (error) {
        console.log(error.message);
        return { labels: [], sales: [] }; // Handle error gracefully
    }
};



const calculateYearlySalesData = async () => {
    try {
        // Initialize an array to hold monthly sales
        const monthlySales = [];
        const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']; // Labels for months

        // Get the current date
        const currentDate = new Date();
        
        // Calculate the start date (current year's January 1st) and end date (current year's December 31st)
        const startDate = new Date(currentDate.getFullYear(), 0, 1);
        const endDate = new Date(currentDate.getFullYear(), 11, 31);

        // Loop through the months (0-11 represents Jan-Dec)
        for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
            // Calculate the start date for the current month
            const startOfMonth = new Date(currentDate.getFullYear(), monthIndex, 1);

            // Calculate the end date for the current month
            const endOfMonth = new Date(currentDate.getFullYear(), monthIndex + 1, 0);

            // Query orders within the date range for the current month
            const orders = await Order.find({
                createdAt: { $gte: startOfMonth, $lte: endOfMonth }
            });

            // Calculate total sales for the month
            const totalSales = orders.reduce((total, order) => total + order.total, 0);

            // Push total sales for the month
            monthlySales.push(totalSales);
        }

        // Construct the monthly sales data object
        const monthlyData = {
            labels: labels,
            sales: monthlySales,
        };

        return monthlyData;
    } catch (error) {
        console.log(error.message);
        return { labels: [], sales: [] }; // Handle error gracefully
    }
};


const loadDashboard = async (req, res) => {
  try {
    const totalRevenue = await calculateTotalRevenue(); // Assuming you have a function to calculate revenue
    const totalPlacedOrders = await calculateTotalPlacedOrders(); // Assuming you have a function to calculate placed orders
    const totalProducts = await calculateTotalProducts(); // Assuming you have a function to calculate total products
    const totalCategories = await calculateTotalCategories(); // Assuming you have a function to calculate total categories
    const currentMonthStart = moment().startOf('month');
    const currentMonthEnd = moment().endOf('month');
    const monthlyEarnings = await calculateMonthlyEarnings(currentMonthStart.toDate(), currentMonthEnd.toDate());
    const weeklySalesData = await calculateWeeklySalesData();
    const monthlySalesData = await calculateMonthlySalesData();
    const yearlySalesData = await calculateYearlySalesData();


    res.render('home', { totalRevenue, totalPlacedOrders, totalProducts, totalCategories, monthlyEarnings, weeklySalesData , monthlySalesData , yearlySalesData  }); 
  } catch (error) {
    console.log(error.message);
  }
};

const usersListLoad = async (req, res) => {
  try {
    const userData = await user.find({ is_admin: 0 });
    res.render("Users", { users: userData });
  } catch {
    console.log(error.message);
  }
};

const deleteuser = async (req, res) => {
  try {
    const id = req.query.id;

    await user.deleteOne({ _id: id });

    res.redirect("/admin/Users");
  } catch (error) {
    console.log(error.message);
  }
};

const logout = async (req, res) => {
  try {
    req.session.destroy();

    res.redirect("/admin");
  } catch (error) {
    console.log(error.message);
  }
};

const blockingUser = async (req, res) => {
  try {
    id = req.query.id;
    console.log(id);
    await user.findByIdAndUpdate({ _id: id }, { $set: { blocked: true } });

    res.redirect("/admin/Users");
  } catch (error) {
    console.log(error.message);
  }
};

const unblockuser = async (req, res) => {
  try {
    id = req.query.id;
    await user.findByIdAndUpdate({ _id: id }, { $set: { blocked: false } });
    res.redirect("/admin/Users");
  } catch (error) {
    console.log(error.message);
  }
};

/**Load Coupon Load */

const loadCouponAdd = async (req, res) => {
  try {
    res.render("addCoupon");
  } catch (error) {
    console.log(error.message);
  }
};

///generateCouponCode

const generateCouponCode = async (req, res) => {
  try {
    const couponCode = await couponHelper.generateCouponCode();
    res.send(couponCode);
  } catch (error) {
    console.log(error.message);
  }
};

//Add Coupn Data

const addCouponData = async (req, res) => {
  try {
    const data = {
      couponCode: req.body.coupon,
      validity: req.body.validity,
      minPurchase: req.body.minPurchase,
      minDiscountPercentage: req.body.minDiscountPercentage,
      maxDiscountValue: req.body.maxDiscount,
      description: req.body.description,
    };

    const response = await couponHelper.addCouponData(data);
    res.json(response);
  } catch (error) {
    console.log(error.message);
  }
};

//show coupon list

const couponList = async (req, res) => {
  try {
    const newCouponList = await newCoupons.find();
    res.render("couponList", { newCouponList });
  } catch (error) {}
};

const loadAddBanner = async (req, res) => {
  try {
    const Banner = await banner.find();

    res.render("addBanner", { Banner: Banner });
  } catch (error) {
    console.log(error.messgae);
  }
};

const addNewBanner = async (req, res) => {
  try {
    const name = req.body.name;
    const discription = req.body.discription;
    const image = req.file.filename;

    if (name) { // Check if 'name' is not null or undefined
      const Banner = new banner({
        name: name,
        discription: discription,
        image: image,
      });

      const BannerData = await Banner.save();
      res.redirect("/admin/bannerList");
    } else {
      // Handle the case where 'name' is null or undefined
      res.status(400).send("Invalid 'name' value.");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};


const showBanners = async (req, res) => {
  try {
    const Banners = await banner.find();

    res.render("bannersList", { Banners: Banners });
  } catch (error) {
    console.log(error.message);
  }
};

const unlistBanner = async (req, res) => {
  try {
    id = req.query.id;

    await banner.findByIdAndUpdate({ _id: id }, { $set: { unlist: true } });

    res.redirect("/admin/bannerList");
  } catch (error) {
    console.log(error.message);
  }
};

const listedBanner = async (req, res) => {
  try {
    id = req.query.id;

    await banner.findByIdAndUpdate({ _id: id }, { $set: { unlist: false } });

    res.redirect("/admin/bannerList");
  } catch (error) {
    console.log(error.message);
  }
};

const deleteBanner = async (req, res) => {
  try {
    const id = req.query.id;

    const product = await banner.findByIdAndDelete(id);

    res.redirect("/admin/bannerList");
  } catch (error) {
    console.log(error.messagae);
  }
};

const getSalesReport = async (req, res) => {
  try {
    const id = req.query.id
    const orderSuccessDetails = await adminHelper.orderSuccess();
    console.log('order success details', orderSuccessDetails);
    res.render("salesReport", {
      order: orderSuccessDetails.orderHistory,
      total: orderSuccessDetails.total,
      _id: id
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
};

const getSalesToday = async (req, res) => {
  try {
    const todaySales = await adminHelper.salesToday();

    res.render("salesReport", {
      order: todaySales.orderHistory,
      total: todaySales.total,
    });
  } catch (error) {
    console.log(error.message);
    res.redirect("/admin/admin-error");
  }
};

const getWeekSales = async (req, res) => {
  try {
    const weeklySales = await adminHelper.weeklySales();
    console.log("weeklySalesssssss", weeklySales);

    res.render("salesReport", {
      order: weeklySales.orderHistory,
      total: weeklySales.total,
    });
  } catch (error) {
    console.log(error.message);
    res.redirect("/admin/admin-error");
  }
};
const getMonthSales = async (req, res) => {
  try {
    const montlySales = await adminHelper.monthlySales();

    res.render("salesReport", {
      order: montlySales.orderHistory,
      total: montlySales.total,
    });
  } catch (error) {
    console.log(error.message);
    res.redirect("/admin/admin-error");
  }
};

const getYearlySales = async (req, res) => {
  try {
    const yearlySales = await adminHelper.yearlySales();

    res.render("salesReport", {
      order: yearlySales.orderHistory,
      total: yearlySales.total,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const salesWithDate = async (req, res) => {
  try {
    const salesWithDate = await adminHelper.salesWithDate(req, res);
    res.render("salesReport", {
      order: salesWithDate.orderHistory,
      total: salesWithDate.total,
    });
  } catch (error) {
    console.log(error.message, "salesWithDate controller error");
    res.redirect("/admin/admin-error");
  }
};

const downloadSalesReport = async (req, res) => {
  try {
     await adminHelper.salesPdf(req, res);
  } catch (error) {
    console.log(error.message, "pdfSales controller error");
    res.redirect("/admin/admin-error");
  }
};

const postSalesReport = (req, res) => {
  const admin = req.session.admin;
  const details = [];
  const getDate = (date) => {
    const orderDate = new Date(date);
    const day = orderDate.getDate();
    const month = orderDate.getMonth() + 1;
    const year = orderDate.getFullYear();
    return `${isNaN(day) ? "00" : day} - ${isNaN(month) ? "00" : month} - ${
      isNaN(year) ? "0000" : year
    }`;
  };

  console.log("llslslls", getDate);
  adminHelper.postReport(req.body).then((orderData) => {
    console.log(orderData, "orderData");
    orderData.forEach((orders) => {
      details.push(orders.orders);
    });
    console.log(details, "details");
    res.render("salesReport", { details, getDate });
  });
};


module.exports = {
  loadLogin,
  verifyLogin,
  loadDashboard,
  logout,
  usersListLoad,
  deleteuser,
  securePassword,
  blockingUser,
  unblockuser,
  loadCouponAdd,
  generateCouponCode,
  addCouponData,
  couponList,
  loadAddBanner,
  addNewBanner,
  showBanners,
  unlistBanner,
  listedBanner,
  deleteBanner,
  getSalesReport,
  postSalesReport,
  getSalesToday,
  getMonthSales,
  getYearlySales,
  getWeekSales,
  salesWithDate,
  downloadSalesReport,
};
