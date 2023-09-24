const mongoose = require('mongoose');

const productsSchema = new mongoose.Schema({
    name:{
        type:String,
        require:true
    },
    category: {
        type: String,
        require:true
    },
    images:{
        type:Array,
        require:true
    },
    price:{
        type:Number,
        require:true
    },
    description:{
        type:String,
        require:true
    },
    stock:{
        type:Number,
        require:true
    },
    unlist : {
        type:Boolean,
        default:false
    }

})

module.exports = mongoose.model('Product',productsSchema)