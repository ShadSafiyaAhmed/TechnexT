const Cart=require('../models/cartModel')
const User=require('../models/userModel')
const Product=require('../models/productsModel')
const Address=require('../models/addressModel')
const Order= require('../models/orderModel')
const orderHelper = require('../helpers/orderHelper')
const Razorpay=require('razorpay')


var instance = new Razorpay({
    key_id: 'rzp_test_UMG6OCOYYtU8fY',
    key_secret: 'gOp1QVvj8IWNoCBJAASMuN1C',
  });
  


  const placeOrder=async(req,res)=>{

        try {


            let userId=req.session.user_id

            let orderDetails=req.body

            console.log('This is Order Detailssss',orderDetails)

            let orderedProducts=await orderHelper.getProductListForOrders(userId)

            let totalOrderValue=await orderHelper.getCartValue(userId)

            if(req.body['paymentMethod']==='COD'){

                orderHelper.placingOrder(userId,orderDetails,orderedProducts,totalOrderValue).then(async(orderId,error)=>{

                    res.json({COD_CHECKOUT:true})

                })
              
            }
            else if(req.body['paymentMethod']==='ONLINE'){

                orderHelper.placingOrder(userId,orderDetails,orderedProducts,totalOrderValue).then(async(orderId,error)=>{

                    // console.log('Ordercontroller',orderId)

                    if(error){

                        res.json({chekoutStatus:false})
                    }
                    else{

                        orderHelper.generateRazorpayOrder(orderId,totalOrderValue).then(async(razorpayOrderDetails,err)=>{

                            // console.log('RZPY orderDetails',razorpayOrderDetails)

                            const user=await User.findById({_id:userId}).lean()


                            res.json(
                                {

                                    ONLINE_CHECKOUT:true,
                                    userDetails:user,
                                    userOrderRequestData:orderDetails,
                                    orderDetails:razorpayOrderDetails,
                                    razorpayKeyId:'rzp_test_UMG6OCOYYtU8fY'
                                }
                              
                            )

                        })

                    }
                    
                })
            }

            else{

                res.json({paymentStatus:false})
            }
          
        } catch (error) {
            
            console.log(error.message)
        }    
  }


const verifyPayment = async (req, res) => {
   
  orderHelper.verifyOnlinePayment(req.body).then(() => {

    console.log('request.body  ',req.body)

    //  let receiptId = req.body['serverOrderDetails[receipt]'];
    let receiptId = req.body.serverOrderDetails.receipt; 

    console.log(receiptId) 

        let paymentSuccess = true;
      orderHelper.updateOnlineOrderPaymentStatus(receiptId, paymentSuccess).then(() => {
            // Sending the receiptId to the above userHelper to modify the order status in the DB
            // We have set the Receipt Id is same as the orders cart collection ID

            res.json({ status: true });
        })

    }).catch((err) => {
        if (err) {

            console.log(err.message);


            let paymentSuccess = false;
         orderHelper.updateOnlineOrderPaymentStatus(receiptId, paymentSuccess).then(() => {
                // Sending the receiptId to the above userHelper to modify the order status in the DB
                // We have set the Receipt Id is same as the orders cart collection ID

                res.json({ status: false });
            })
        }
    })
}





const OrderList=async(req,res)=>{

    try {

        const Orders= await Order.find()

        res.render('OrderList',{userOrder:Orders})

        
    } catch (error) {
        
        console.log(error.message)
    }
}


const  orderDetails=async(req,res)=>{

    try {
         const id=req.query.id
         const userOrder=await Order.findById({_id:id}).populate('items.product').exec()
        res.render('orderDetails',{order:userOrder})
        
    } catch (error) {

        console.log(error.message)
        
    }
}

const cancelOrder = async (req, res) => {
    const orderId = req.query.orderId;

    try {
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Update the order status to "Order Cancelled"
        order.status = 'Order Cancelled';
        await order.save();

        return res.redirect('/myAccount'); // Redirect back to user's order list
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error cancelling order' });
    }
};


const updateOrderStatus = async (req, res) => {
    const { id, status } = req.query;

    try {
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Update the order status
        order.status = status;
        await order.save();

        return res.redirect('/admin/orderList'); // Redirect back to order list page
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error updating order status' });
    }
};

const requestReturn = async (req, res) => {
    const orderId = req.query.orderId;

    try {
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Update the order status to "Requested Return"
        order.status = 'Requested Return';
        await order.save();

        return res.redirect('/myAccount'); // Redirect back to user's order list
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Error requesting return' });
    }
};


const acceptReturn=async(req,res)=>{

    try {

        id=req.query.id
       const order=await Order.findById(id)

       order.status='Returned'

       await order.save()

        res.redirect('/admin/OrderList')
    } catch (error) {
        
        console.log(error.message)
    }
}

const declineReturn=async(req,res)=>{

    try {
        const order=await Order.findById(id)


        id=req.query.id


       order.status='Return declined'

       await order.save()
       res.redirect('/admin/OrderList')
        
    } catch (error) {
        

        console.log(error.message)
    }
}




module.exports={

    OrderList,
    orderDetails,
    updateOrderStatus,
    cancelOrder,
    requestReturn,
    acceptReturn,
    declineReturn,
    placeOrder,
    verifyPayment

}