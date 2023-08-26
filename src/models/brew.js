const mongoose = require('mongoose')

const BrewSchema = new mongoose.Schema({
    product_name : String,
    product_quantity : Number,
    product_details : String,
    expires_in : Number,
    product_expiry : Date,
    cost_per_unit : Number,
    items : [{
        product_name : String,
        product_quantity : Number, 
        cost_per_unit : Number, 
        step : Number,
    }],
    structures : [{
        structure_name : String,
        structure_quantity : Number,
        step : Number
    }],
    time_taken : [{
        step : Number,
        time : Number //in mins
    }],
    status : {
        type : String,
        default : "new",
        enum : ["new", "processing", "completed"]
    },
    owner : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'WorkspaceM',
    }
},{
    strict : true,
    versionKey : false,
    timestamps : true
})


const Brew = mongoose.model('Brew',BrewSchema)
module.exports = Brew 