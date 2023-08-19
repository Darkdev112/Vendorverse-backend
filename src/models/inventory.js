const mongoose = require('mongoose')

const InventorySchema = new mongoose.Schema({
    product_name : {
        type : String,
        required : true
    },
    product_quantity : {
        type : Number,
        required : true
    },
    product_expiry : {
        type : Date,
        required : true
    },
    cost_per_unit : {
        type : Number,
        required : true
    },
    incremental_cost : {
        type : Number,      // only for distributors
    },
    owner : {
        type : mongoose.Schema.Types.ObjectId,
        refPath : 'ownerSelect', 
    },
    ownerSelect : {
        type : String,
        required : true,
        enum : ["WorkspaceD", "WorkspaceR", "WorkspaceM"]
    },
},{
    strict : true,
    versionKey : false,
    timestamps : true
})


const Inventory = mongoose.model('Inventory',InventorySchema)
module.exports = Inventory 