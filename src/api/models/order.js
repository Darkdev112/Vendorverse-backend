const mongoose = require('mongoose')

const OrderSchema = new mongoose.Schema({
    product_name : {
        type : String,
        required : true,
    },
    product_details : {
        type : String,
    },
    product_quantity : {
        type : Number,
        required : true
    },
    product_expiry : {
        type : Date,
    },
    status : {
        type : String,  
        enum : ["new", "rejected" , "pending", "completed"],
        default : "new",
    },
    isOrder : {
        type : Boolean,   // for distributor
    },
    order_of : {
        type : mongoose.Schema.Types.ObjectId, 
    },
    to_pay : {
        type : Number,
    },
    has_paid : {
        type : Boolean,
        default : false,
    },
    delivery: {
        status : {
            type : String, 
            default : "new",
            enum : ["new","dispatch", "completed"]
        },
        time : {
            type : Date,
        },
        distance : Number,
        speed : Number
    },
    brew_progress : {
        type : Number,
    },
    from: {
        type : mongoose.Schema.Types.ObjectId,
        refPath : 'fromSelect', 
    },
    fromSelect : {
        type : String,
        required : true,
        enum : ["WorkspaceD", "WorkspaceR", "WorkspaceM"]
    },
    for: {
        type : mongoose.Schema.Types.ObjectId,
        refPath : 'forSelect', 
    },
    forSelect : {
        type : String,
        required : true,
        enum : ["WorkspaceD", "WorkspaceR"]
    },
},{
    strict : true,
    versionKey : false,
    timestamps : true
})

const Order = mongoose.model('Order',OrderSchema)
module.exports = Order 