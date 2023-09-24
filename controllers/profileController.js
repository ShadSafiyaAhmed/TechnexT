const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const Order = require("../models/orderModel");
const userHelper = require("../helpers/userHelper");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Wallet = require("../models/walletModel");
const profileHelper = require("../helpers/profileHelper");

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

const editInfo = async (req, res) => {
  try {
    const userId = req.session.user_id;

    const { name, email, mobile } = req.body;

    const result = await User.updateOne(
      { _id: userId },
      { $set: { name: name, email: email, mobile: mobile } }
    );

    res.redirect("/account");
  } catch (error) {
    console.log(error.message);
  }
};

const editPassword = async (req, res) => {
  try {
    const newPass = req.body.newPass;
    const confPass = req.body.confPass;
    const userId = req.session.user_id;

    if (newPass === confPass) {
      const spassword = await securePassword(confPass);
      console.log(spassword);

      const result = await User.updateOne(
        { _id: userId },
        { $set: { password: spassword } }
      );

      res.redirect("/account");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const userOrderList = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const userOrder = await Order.find({ user: userId })
      .populate("items.product")
      .exec();

    res.render("profileOrderList", {
      myOders: userOrder,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const cancelOrder = async (req, res) => {
  const orderId = req.query.orderId;

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "this Order not found" });
    }

    // Update the order status to "Order Cancelled"
    order.status = "Order Cancelled";
    await order.save();

    return res.redirect("/account"); // Redirect back to user's order list
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Error cancelling order" });
  }
};

const updateOrderStatus = async (req, res) => {
  const { id, status } = req.query;

  try {
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found he he he" });
    }

    // Update the order status
    order.status = status;
    await order.save();

    return res.redirect("/admin/orderList"); // Redirect back to order list page
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Error updating order status" });
  }
};

const requestReturn = async (req, res) => {
  const orderId = req.query.orderId;

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found hu hu hu" });
    }

    // Update the order status to "Requested Return"
    order.status = "Requested Return";
    await order.save();

    return res.redirect("/profileOrderList"); // Redirect back to user's order list
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Error requesting return" });
  }
};

const acceptReturn = async (req, res) => {
  try {
    id = req.query.id;

    const order = await Order.findByIdAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { status: "Returned" } },
      { new: true }
    ).exec();

    console.log("ndkjdnkdnkdnkdnkdn", order);

    // Check if the payment method is online and the order value is greater than 0
    if (
      (order.paymentMethod === "ONLINE" || order.paymentMethod === "WALLET") &&
      order.total > 0
    ) {
      // Check if a wallet exists for the user
      const wallet = await Wallet.findOne({ userId: order.user }).exec();

      if (wallet) {
        // Wallet exists, increment the wallet amount
        const updatedWallet = await Wallet.findOneAndUpdate(
          { userId: order.user },
          { $inc: { walletAmount: order.total } },
          { new: true }
        ).exec();

        console.log(updatedWallet, "updated wallet with order value");
      } else {
        // Wallet doesn't exist, create a new wallet with the order value as the initial amount
        const newWallet = new Wallet({
          userId: order.user,
          walletAmount: order.total,
        });

        const createdWallet = await newWallet.save();
        console.log(createdWallet, "created new wallet with order value");
      }
    }

    res.redirect("/admin/OrderList");
  } catch (error) {
    console.log(error.message);
  }
};

const declineReturn = async (req, res) => {
  try {
    const order = await Order.findById(id);

    id = req.query.id;

    order.status = "Return declined";

    await order.save();
    res.redirect("/admin/OrderList");
  } catch (error) {
    console.log(error.message);
  }
};

const loadOrderSlip = async (req, res) => {
  try {
    await profileHelper.loadingOrdersViews(req, res);
  } catch (error) {
    console.log(error.message);
    res.redirect("/user-error");
  }
};

module.exports = {
  securePassword,
  editInfo,
  editPassword,
  userOrderList,
  updateOrderStatus,
  requestReturn,
  acceptReturn,
  declineReturn,
  cancelOrder,
  loadOrderSlip,
};
