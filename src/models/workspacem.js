const mongoose = require('mongoose')

const RawInventorySchema = new mongoose.Schema({
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
    }
})

const ProcessedInventorySchema = new mongoose.Schema({
    product_name : {
        type : String,
        required : true
    },
    product_quantity : {
        type : Number,
        required : true,
    },
    product_expiry : {
        type : Date,
        required : true,
    },
    cost_per_unit : {
        type : Number,
        required : true,
    },
    isOrder : {
        type : Boolean,
        required : true,
        default : false,
    },
    for : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'WorkspaceD', 
    }
},{
    strict : true,
    versionKey : false,
    timestamps : true
})

const Structures = new mongoose.Schema({
    structure_name : {
        type : String,
        required : true
    },
    structure_quantity : {
        type : Number,
        required : true
    },
    cost_per_unit : {
        type : Number,
        required : true
    },
},{
    strict : true,
    versionKey : false,
    timestamps : true
})

const WorkspaceMSchema = new mongoose.Schema({
    email : {
        type : String,
        required : true,
        unique : true,
        lowercase : true,
    },
    owner : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Profile',
    },
    rawInventory : [RawInventorySchema],
    processedInventory : [ProcessedInventorySchema],
    vendorPoints : {
        type : Number
    },
    structures : [Structures]
})

const WorkspaceM = mongoose.model('WorkspaceM', WorkspaceMSchema)
module.exports =  WorkspaceM