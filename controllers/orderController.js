const Cart = require("../models/cartModel");
const User = require("../models/userModel");
const Product = require("../models/productsModel");
const Address = require("../models/addressModel");
const Order = require("../models/orderModel");
const orderHelper = require("../helpers/orderHelper");
const couponHelpers = require("../helpers/couponHelper");
const Razorpay = require("razorpay");
const PDFDocument = require('pdfkit');
const fs = require('fs');
require("dotenv").config();
const path = require('path');

var instance = new Razorpay({
  key_id: 'rzp_test_6QbcMMkE85pwrc',
  key_secret: 'q88r3U9eWbFd3sSS0Tj2W0fq'
});

const placeOrder = async (req, res) => {
  try {
    let userId = req.session.user_id;
    let orderDetails = req.body;

    let orderedProducts = await orderHelper.getProductListForOrders(userId);

    if (orderedProducts) {
      for (const orderedProduct of orderedProducts) {
        const productId = orderedProduct.product;
        const quantityOrdered = orderedProduct.quantity;
      
        const product = await Product.findById(productId);
      
        if (!product) {
          throw new Error(`Product with ID ${productId} not found.`);
        }
      
        const newStock = product.stock - quantityOrdered;
        product.stock = Math.max(0, newStock);
      
        const updatedProduct = await product.save();
      
        if (updatedProduct.stock < 0) {
          throw new Error(`Insufficient stock for product ${productId}.`);
        }
      }

      let totalOrderValue = await orderHelper.getCartValue(userId);
      const availableCouponData = await couponHelpers.checkCurrentCouponValidityStatus(userId, totalOrderValue);
      let couponDiscountAmount = 0;

      if (availableCouponData.status) {
        couponDiscountAmount = availableCouponData.couponDiscount;
        orderDetails.couponDiscount = couponDiscountAmount;
        totalOrderValue -= couponDiscountAmount;
        const updateCouponUsedStatusResult = await couponHelpers.updateCouponUsedStatus(userId, availableCouponData.couponId);
      }

      if (req.body["paymentMethod"] === "COD") {
        orderHelper.placingOrder(userId, orderDetails, orderedProducts, totalOrderValue).then(async (orderId, error) => {
          res.json({ COD_CHECKOUT: true });
        });
      } else if (req.body["paymentMethod"] === "WALLET") {
        const walletBalance = await orderHelper.walletBalance(userId);
        if (walletBalance.walletAmount >= totalOrderValue) {
          orderHelper.placingOrder(userId, orderDetails, orderedProducts, totalOrderValue).then(async (orderId, error) => {
            res.json({ WALLET_CHECKOUT: true, orderId });
          });
        } else {
          res.json({ error: "Insufficient balance." });
        }
      } else if (req.body["paymentMethod"] === "ONLINE") {
        orderHelper.placingOrder(userId, orderDetails, orderedProducts, totalOrderValue).then(async (orderId, error) => {
          if (error) {
            res.json({ chekoutStatus: false });
          } else {
            orderHelper.generateRazorpayOrder(orderId, totalOrderValue).then(async (razorpayOrderDetails, err) => {
              const user = await User.findById({ _id: userId }).lean();
              res.json({
                ONLINE_CHECKOUT: true,
                userDetails: user,
                userOrderRequestData: orderDetails,
                orderDetails: razorpayOrderDetails,
                razorpayKeyId: 'rzp_test_6QbcMMkE85pwrc',
              });
            });
          }
        });
      }
    } else {
      res.json({ paymentStatus: false });
    }
  } catch (error) {
    console.log(error.message);
    res.redirect('/user-error');
  }
};

const verifyPayment = async (req, res) => {
  const userId = req.session.user_id
  console.log('this is my user id',typeof userId)
  orderHelper.verifyOnlinePayment(req.body).then(() => {
    console.log("request.body  ", req.body);
    let receiptId = req.body.serverOrderDetails.receipt;
    console.log(receiptId);
    let paymentSuccess = true;
    orderHelper.updateOnlineOrderPaymentStatus(receiptId, paymentSuccess,userId).then(() => {
      res.json({ status: true });
    });
  }).catch((err) => {
    if (err) {
      console.log(err.message);
      let paymentSuccess = false;
      orderHelper.updateOnlineOrderPaymentStatus(receiptId, paymentSuccess,userId).then(() => {
        res.json({ status: false });
      });
    }
  });
};

const walletOrder = async (req, res) => {
  try {
    const orderId = req.query.id;
    const userId = req.session.user_id;
    const updatingWallet = await orderHelper.updateWallet(userId, orderId);
    res.redirect("/orderSuccessful");
  } catch (error) {
    console.log(error.message);
    res.redirect("/user-error");
  }
};

const OrderList = async (req, res) => {
  try {
    const Orders = await Order.find();
    res.render("orderList", { userOrder: Orders });
  } catch (error) {
    console.log(error.message);
  }
};

const orderDetails = async (req, res) => {
  try {
    const id = req.query.id;
    const userOrder = await Order.findById({ _id: id })
      .populate("items.product")
      .exec();
    res.render("orderDetails", { order: userOrder });
  } catch (error) {
    console.log(error.message);
  }
};

const renderCancelOrderPage = async (req, res) => {
  const orderId = req.query.orderId;
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.render("cancelOrder", { orderId });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Error rendering cancellation page" });
  }
};

const cancelOrder = async (req, res) => {
  // const orderId = req.query.orderId;
  const { orderId,reason, comments } = req.body;
  // console.log('this is orderId', orderId)

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "cancel Order not found" });
    }
    order.status = "Order Cancelled";
    order.cancelReason = reason;
    order.cancelComments = comments;

    await order.save();

    return res.redirect("/account");
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
      return res.status(404).json({ message: "Order not found" });
    }

    order.status = status;
    await order.save();

    return res.redirect("/admin/orderList");
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Error updating order status" });
  }
};

const returnOrderForm = async(req,res) => {
  try {
      const orderId = req.query.orderId;
      res.render('returnOrder',{orderId})
  } catch (error) {
      console.error(error.message)
  }
}

const requestReturn = async (req, res) => {
  // const orderId = req.query.orderId
  const { orderId,reason, comments } = req.body;
  console.log('this is orderId', orderId)
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if(order.status === 'Delivered') {
      order.status = 'Requested Return';
      order.returnReason = reason;
      order.returnComments = comments;
      await order.save()

      return res.redirect ('/account')
  }else{
      return res.status(400).json({message: 'Invalid request for return'})
  }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Error requesting return" });
  }
};

const declineReturn = async (req, res) => {
  try {
    const order = await Order.findById(id);

    id = req.query.id;

    order.status = "Return declined";

    await order.save();
    res.redirect("/admin/orderList");
  } catch (error) {
    console.log(error.message);
  }
};

const viewOrderDetail = async (req, res) => {
  try {
      const orderId = req.query.id; 
      const userId = req.session.user_id;

      const userOrder = await Order.findOne({ _id: orderId, user: userId })
      .populate('items.product')

      const user = await User.findById(userId);

      if (!userOrder) {
          return res.status(404).json({ message: 'Order not found' });
      }

      userOrder.items.forEach(item => {
          item.total = item.price * item.quantity;
      });

      res.render('orderDetails', { order: userOrder, user: user });

  } catch (error) {
      console.log(error.message);
      res.status(500).json({ message: 'Internal server error' });
  }
}

const invoiceDownload = async (req, res) => {
  try {
      const orderId = req.params.orderId;
      const order = await Order.findById(orderId).populate('items.product');

      if (!order) {
          return res.status(404).json({ message: 'Order not found' });
      }

      const filePath = path.join(__dirname, 'pdfs', `invoice-${order._id}.pdf`);

      const doc = new PDFDocument();
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      doc.font('Helvetica-Bold');
      doc.fontSize(12);

      doc.text('Invoice', { align: 'center', fontSize: 18 });

      doc.text(`Order ID: ${order._id}`);
      doc.text(`Date: ${order.createdAt.toLocaleDateString()}`);
      doc.moveDown();

      doc.text('Delivery Address:', { fontSize: 14 });
      doc.rect(70, doc.y, 460, 60).stroke(); 
      doc.text(`Name: ${order.addressDetails.name}`);
      doc.text(`Mobile: ${order.addressDetails.mobile}`);
      doc.text(`Address: ${order.addressDetails.homeAddress}, ${order.addressDetails.city}, ${order.addressDetails.street}`);
      doc.moveDown(2);

      doc.text('Order Items:', { fontSize: 14 });

      let totalAmount = 0; 

      order.items.forEach((item, index) => {
          doc.text(`${index + 1}. Product: ${item.product.name}`);
          doc.text(`   Quantity: ${item.quantity}`);
          doc.text(`   Price: \u20B9${item.price}`); 
          
          const itemTotal = item.quantity * item.price;
          
          doc.text(`   Total: \u20B9${itemTotal.toFixed(2)}`); 
          doc.moveDown();
          
          totalAmount += itemTotal; 
      });

      doc.text(`Total Amount: \u20B9${totalAmount.toFixed(2)}`); 

      doc.end();

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=invoice-${order._id}.pdf`);

      const pdfStream = fs.createReadStream(filePath);
      pdfStream.pipe(res);

      pdfStream.on('end', () => {
          fs.unlink(filePath, (err) => {
              if (err) {
                  console.error('Error deleting PDF file:', err);
              }
          });
      });
  } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: 'Internal server error' });
  }
}



module.exports = {
  OrderList,
  orderDetails,
  updateOrderStatus,
  renderCancelOrderPage,
  cancelOrder,
  returnOrderForm,
  requestReturn,
  declineReturn,
  placeOrder,
  verifyPayment,
  walletOrder,
  viewOrderDetail,
  invoiceDownload,
};
