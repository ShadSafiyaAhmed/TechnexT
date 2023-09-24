const Order= require('../models/orderModel')
const User=require("../models/userModel")
const mongoose = require('mongoose');
const moment = require("moment-timezone");
const pdfPrinter = require("pdfmake");
const fs = require('fs')



const loadingDashboard= async (req, res) => {
    return new Promise(async (resolve, reject) => {
        try {
            const users = await User.find({}).lean().exec();
            const totaluser = users.length;

            const totalSales = await Order.aggregate([
                {
                    $match: {
                        status: { $in: ["Placed","Delivered"] },

                    },
                },
                {
                    $group: {
                        _id: null,
                        totalSum: { $sum: "$total" },
                    },
                },
            ]);

        

            const salesbymonth = await Order.aggregate([
                {
                    $match: {
                        status: { $nin: ["Order Cancelled","Pending"] },
                    },
                },
                {
                    $group: {
                        _id: { $month: "$createdAt" },
                        totalSales: { $sum: "$total" },
                    },
                },
                {
                    $sort: {
                        _id: 1,
                    },
                },
            ]);

           

            const paymentMethod = await Order.aggregate([
                {
                    $match: {
                        status: { $in: ["Placed", "Delivered"] }, // Exclude "cancelled" status
                    },
                },
                {
                    $group: {
                        _id: "$paymentMethod", // Group by paymentMethod only
                        totalOrderValue: { $sum: "$total" },
                        count: { $sum: 1 },
                    },
                },
            ]);

          

            const currentYear = new Date().getFullYear();
            const previousYear = currentYear - 1;

            const yearSales = await Order.aggregate([
                // Match orders within the current year or previous year
                {
                    $match: {
                        status: { $in: ["Placed", "Delivered"] },
                        createdAt: {
                            $gte: new Date(`${previousYear}-01-01`),
                            $lt: new Date(`${currentYear + 1}-01-01`),
                        },
                    },
                },
                {
                    $group: {
                        _id: {
                            $year: "$createdAt",
                        },
                        totalSales: {
                            $sum: "$total",
                        },
                    },
                },
            ])
                .exec();

              
            // to get today sales

            // console.log(yearSales, 'yearSales');

            const todaysalesDate = new Date();
            const startOfDay = new Date(
                todaysalesDate.getFullYear(),
                todaysalesDate.getMonth(),
                todaysalesDate.getDate(),
                0,
                0,
                0,
                0
            );
            const endOfDay = new Date(
                todaysalesDate.getFullYear(),
                todaysalesDate.getMonth(),
                todaysalesDate.getDate(),
                23,
                59,
                59,
                999
            );

            const todaySales = await Order.aggregate([
                {
                    $match: {
                        status: { $in: ["pending", "Delivered", "Placed"] },

                        createdAt: {
                            $gte: startOfDay, 
                            $lt: endOfDay,
                        },
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: "$total" },
                    },
                },
            ]);

        

            const dashBoardDetails = {
                totaluser,
                totalSales,
                salesbymonth,
                paymentMethod,
                yearSales,
                todaySales
            }

            resolve(dashBoardDetails)



        } catch (error) {
            reject(error)
        }
    })

}

const OrdersList= async (req, res) => {
    try {
        let orderDetails = await Order.find().populate('user').lean();
        orderDetails = orderDetails.reverse();

        const orderHistory = orderDetails.map(history => {
            let createdOnIST = moment(history.createdAt)
                .tz('Asia/Kolkata')
                .format('DD-MM-YYYY h:mm A');

            return { ...history, date: createdOnIST, userName: history.user.name };
        });
        return orderHistory
    } catch (error) {
        console.log(error.message)
        res.redirect('/admin/admin-error')
    }
}



//new salesReport function
const orderSuccess= () => {
  return new Promise(async (resolve, reject) => {
      try {
        console.log('Inside orderSuccess'); // Add this line
          const order = await Order
              .find({ status: { $in: ["Placed", "Delivered"] } })
              .populate('user')
              .sort({ date: -1 })
              .lean()
              .exec();



              const orderHistory = order.map(history => {
                let createdOnIST = moment(history.createdAt)
                    .tz('Asia/Kolkata')
                    .format('DD-MM-YYYY h:mm A');
            
                // Check if history.user is defined before accessing history.user.name
                const userName = history.user?.name || 'N/A';
            
                return { ...history, date: createdOnIST, userName };
            });            

          const total = await Order.aggregate([
              {
                  $match: {
                      status: { $in: ["Placed", "Delivered",] },
                  },
              },
              {
                  $group: {
                      _id: null,
                      totalAmount: { $sum: "$total" },
                  },
              },
              {
                  $sort: {
                      totalAmount: 1,
                  },
              },
          ]);

       
          const orderDetails = {
              orderHistory,
              total
          }
          console.log('orderDetails:', orderDetails); // Add this line
          resolve(orderDetails)
      } catch (error) {
        console.error('Error in orderSuccess:', error); // Add this line
          reject(error)
      }
  })
}

const salesToday= () => {
  return new Promise(async (resolve, reject) => {
      try {
          const todaysales = new Date();
          const startOfDay = new Date(
              todaysales.getFullYear(),
              todaysales.getMonth(),
              todaysales.getDate(),
              0,
              0,
              0,
              0
          );
          const endOfDay = new Date(
              todaysales.getFullYear(),
              todaysales.getMonth(),
              todaysales.getDate(),
              23,
              59,
              59,
              999
          );
          const order = await Order.find({
              status: { $nin: ["Order Cancelled"] },
              createdAt: {
                  $gte: startOfDay,
                  $lt: endOfDay
              }
          })
              .populate('user')
              .sort({ date: -1 })


          const orderHistory = order.map(history => {
              const createdOnIST = moment(history.createdAt).tz('Asia/Kolkata').format('DD-MM-YYYY h:mm A');
              return { ...history._doc, date: createdOnIST, userName: history.user.name };
          });



          const total = await Order.aggregate([
              {
                  $match: {

                      status: { $in: ["Placed", "Delivered"] },

                      createdAt: {
                          $gte: startOfDay, // Set the current date's start time
                          $lt: endOfDay,
                      },
                  },
              },
              {
                  $group: {
                      _id: null,
                      totalAmount: { $sum: "$total" },
                  },
              },
          ]);

      
       

          const salesToday = {
              orderHistory,
              total
          }

          if (order) {
              resolve(salesToday)
          }
          else {
              resolve("No sales registerd today")
          }
      } catch (error) {
          reject(error)
      }
  })
}

const weeklySales= () => {
    return new Promise(async (resolve, reject) => {
        try {
            const currentDate = new Date();

            // Calculate the start and end dates of the current week
            const startOfWeek = new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                currentDate.getDate() - currentDate.getDay()
            );
            const endOfWeek = new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                currentDate.getDate() + (6 - currentDate.getDay()),
                23,
                59,
                59,
                999
            );

            const order = await Order.find({
                status: { $nin: ["Order Cancelled"] },
                createdAt: {
                    $gte: startOfWeek,
                    $lt: endOfWeek
                }
            })
                .populate('user')
                .sort({ date: -1 });


            const orderHistory = order.map(history => {
                const createdOnIST = moment(history.createdAt).tz('Asia/Kolkata').format('DD-MM-YYYY h:mm A');
                return { ...history._doc, date: createdOnIST, userName: history.user.name };
            });

            const total = await Order.aggregate([
                {
                    $match: {
                        status: { $in: ["Placed", "Delivered"] },
                        createdAt: {
                            $gte: startOfWeek,
                            $lt: endOfWeek,
                        },
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: "$total" },
                    },
                },
            ]);

            const weeklySales = {
                orderHistory,
                total
            }
            resolve(weeklySales)

        } catch (error) {
            reject(error)
        }
    })
}


const monthlySales= () => {
  return new Promise(async (resolve, reject) => {
      try {
          const thisMonth = new Date().getMonth() + 1;
          const startofMonth = new Date(
              new Date().getFullYear(),
              thisMonth - 1,
              1,
              0,
              0,
              0,
              0
          );
          const endofMonth = new Date(
              new Date().getFullYear(),
              thisMonth,
              0,
              23,
              59,
              59,
              999
          );
     
          const order = await Order.find({
              status: { $nin: ["Order Cancelled","Returned","Pending"] },
              createdAt: {
                  $lt: endofMonth,
                  $gte: startofMonth,
              }
          })
              .populate('user')
              .sort({ date: -1 });


              const orderHistory = order.map(history => {
                let createdOnIST = moment(history.createdAt)
                    .tz('Asia/Kolkata')
                    .format('DD-MM-YYYY h:mm A');
            
                // Check if history.user is defined before accessing history.user.name
                const userName = history.user?.name || 'N/A';
            
                return { ...history, date: createdOnIST, userName };
            });

          const total = await Order.aggregate([
              {
                  $match: {
                      status: { $in: ["Placed", "Delivered"] },
                      createdAt: {
                          $lt: endofMonth,
                          $gte: startofMonth,
                      },
                  },
              },
              {
                  $group: {
                      _id: null,
                      totalAmount: { $sum: "$total" },
                  },
              },
          ]);

          const monthlySales = {
              orderHistory,
              total
          }

          resolve(monthlySales)



      } catch (error) {
          reject(error)
      }
  })
}


const yearlySales= () => {
    return new Promise(async (resolve, reject) => {
        try {
            const today = new Date().getFullYear();
            const startofYear = new Date(today, 0, 1, 0, 0, 0, 0);
            const endofYear = new Date(today, 11, 31, 23, 59, 59, 999);


            const order = await Order.find({
                status: { $nin: ["Order Cancelled","Pending"] },
                createdAt: {
                    $lt: endofYear,
                    $gte: startofYear,
                }
            })
                .populate('user')
                .sort({ date: -1 });


                const orderHistory = order.map(history => {
                    let createdOnIST = moment(history.createdAt)
                        .tz('Asia/Kolkata')
                        .format('DD-MM-YYYY h:mm A');
                
                    // Check if history.user is defined before accessing history.user.name
                    const userName = history.user?.name || 'N/A';
                
                    return { ...history, date: createdOnIST, userName };
                });

            const total = await Order.aggregate([
                {
                    $match: {
                        status: { $in: ["Placed", "Delivered"] },
                        createdAt: {
                            $lt: endofYear,
                            $gte: startofYear,
                        },
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: "$total" },
                    },
                },
            ]);

            const yearlySales = {
                orderHistory,
                total
            }

            console.log('yearrrrrrrr',yearlySales)

            resolve(yearlySales)


        } catch (error) {
            reject(error)
        }
    })
}

const salesWithDate= (req, res) => {
    return new Promise(async (resolve, reject) => {
        try {
            const date = new Date();
            const fromDate = new Date(req.body.fromDate);
            const toDate = new Date(req.body.toDate);
            fromDate.setHours(0, 0, 0, 0);
            toDate.setHours(23, 59, 59, 999);

            const order = await Order.find({
                status: { $nin: ["Order Cancelled"] },
                createdAt: {
                    $lt: toDate,
                    $gte: fromDate,
                }
            })
                .populate('user')
                .sort({ date: -1 });


            const orderHistory = order.map(history => {
                let createdOnIST = moment(history.createdAt)
                    .tz('Asia/Kolkata')
                    .format('DD-MM-YYYY h:mm A');
            
                const userName = history.user?.name || 'N/A';
            
                return { ...history, date: createdOnIST, userName };
            });
            const total = await Order.aggregate([
                {
                    $match: {
                        status: { $in: ["Placed", "Delivered"] },
                        date: {
                            $lt: toDate,
                            $gte: fromDate,
                        },
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: "$total" },
                    },
                },
            ]);

            const salesWithDate = {
                orderHistory,
                total
            }

            resolve(salesWithDate)
        } catch (error) {
            console.log('salesWithDate helper error')
            reject(error)
        }
    })
}


const salesPdf= (req, res) => {
    return new Promise(async (resolve, reject) => {
        try {
            let startY = 150;
            const writeStream = fs.createWriteStream("order.pdf");
            const printer = new pdfPrinter({
                Roboto: {
                    normal: "Helvetica",
                    bold: "Helvetica-Bold",
                    italics: "Helvetica-Oblique",
                    bolditalics: "Helvetica-BoldOblique",
                },
            });

            const order = await Order
                .find({ status: { $in: ["Placed", "Delivered"] } })
                .populate('user')
                .exec();

            const totalAmount = await Order.aggregate([
                {
                    $match: {
                        status: { $nin: ["Order Cancelled"] },
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: "$total" },
                    },
                },
            ]);

            const dateOptions = { year: "numeric", month: "long", day: "numeric" };
            const docDefinition = {
                content: [
                    { text: "TechnexT", style: "header" },
                    { text: "\n" },
                    { text: "Order Information", style: "header1" },
                    { text: "\n" },
                    { text: "\n" },
                ],
                styles: {
                    header: {
                        fontSize: 25,
                        alignment: "center",
                    },
                    header1: {
                        fontSize: 12,
                        alignment: "center",
                    },
                    total: {
                        fontSize: 18,
                        alignment: "center",
                    },
                },
            };

            const tableBody = [
                ["Index", "Date", "User", "Status", "Method", "Amount"], // Table header
            ];

            for (let i = 0; i < order.length; i++) {
                const data = order[i];
                const formattedDate = new Intl.DateTimeFormat(
                    "en-US",
                    dateOptions
                ).format(new Date(data.createdAt));
                tableBody.push([
                    (i + 1).toString(), // Index value
                    formattedDate,
                    data.user.name,
                    data.status,
                    data.paymentMethod,
                    data.status,
                ]);
            }

            const table = {
                table: {
                    widths: ["auto", "auto", "auto", "auto", "auto", "auto"],
                    headerRows: 1,
                    body: tableBody,
                },
            };

            docDefinition.content.push(table);
            docDefinition.content.push([
                { text: "\n" },
                { text: `Total: ${totalAmount[0]?.totalAmount || 0}`, style: "total" },
            ]);
            const pdfDoc = printer.createPdfKitDocument(docDefinition);

            pdfDoc.pipe(writeStream);

            pdfDoc.end();

            writeStream.on("finish", () => {
                res.download("order.pdf", "order.pdf");
            });
        } catch (error) {
            console.log('pdfSales helper error')
            reject(error)
        }
    })
}

const getSalesReport = () => {
    try {
      return new Promise((resolve, reject) => {
        Order.aggregate([
          {
            $unwind: "$items",
          },
          {
            $match: {

                "status": "Delivered",
            },
          },
        ]).then((response) => {
          resolve(response);
        });
      });
    } catch (error) {
      console.log(error.message);
    }
  };



  


module.exports={
 orderSuccess,
 salesToday,
 monthlySales,
 yearlySales,
 weeklySales,
 salesWithDate,
 salesPdf,
 OrdersList,
 loadingDashboard

}