const mongoose=require('mongoose');
mongoose.connect("mongodb+srv://sahad2u:QXHeNomkFLkMboZm@cluster0.1fwuwsm.mongodb.net/");

 const express=require("express");
// const user_route = require('./routes/userRoute');

require('dotenv').config();



const port = process.env.PORT || 3000

 const app=express()
const path = require('path')
 const publicFolderPath = path.join(__dirname, './public');
app.use(express.static(publicFolderPath));


 //for user routes
const userRoute=require('./routes/userRoute')
app.use('/',userRoute)

//for Admin route
const adminRoute=require('./routes/adminRoute')
app.use('/admin',adminRoute)




 app.listen(port,function(){

    console.log("Server is starting...")

 })