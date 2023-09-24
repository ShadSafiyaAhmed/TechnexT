const Order = require("../models/orderModel");
const Address = require("../models/addressModel");
const { ObjectId } = require("mongodb");




 const loadingOrdersViews= async (req, res) => {
    try {
        const orderId = req.query.orderId;

        const userId = req.session.user_id

   
        const order = await Order.findOne({ _id: orderId })
            .populate({
                path: 'items.product',
                select: 'name price images',
            })

      

        // const createdOnIST = moment(order.date).tz('Asia/Kolkata').format('DD-MM-YYYY h:mm A');
        // order.date = createdOnIST;

        const orderDetails = order.items.map(item => {
            const images = item.product.images|| []; // Set images to an empty array if it is undefine                          
            const image = images.length > 0 ? images[0] : ''; // Take the first image from the array if it exists
            return {
                name: item.product.name,
                images: image,
                price: item.product.price,
                total: item.price,
                quantity: item.quantity,
                status: order.status,

            };
        });

        const deliveryAddress = {
            name: order.addressDetails.name,
            homeAddress: order.addressDetails.homeAddress,
            city: order.addressDetails.city,
            street: order.addressDetails.street,
            postalCode: order.addressDetails.postalCode,
        };

        const subtotal = order.total;
        const total = order.total
    


        res.render('orderSlip', {
           
            orderDetails: orderDetails,
            deliveryAddress: deliveryAddress,
            total: total,
            orderId: orderId,
            order:order
          
        });

    } catch (error) {
        console.log(error.message);
        
        // res.redirect('/user-error')
    }
}


  module.exports={

    loadingOrdersViews,
  
  }