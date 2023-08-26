const mongoose = require('mongoose')

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
    vendorPoints : {
        type : Number
    },
    structures : [{
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
    }]
})

WorkspaceMSchema.virtual('inventory',{
    ref : 'Inventory',
    localField : '_id',
    foreignField : 'owner',
})

WorkspaceMSchema.virtual('orders',{
    ref : 'Order',
    localField : '_id',
    foreignField : 'from'
})

WorkspaceMSchema.virtual('products',{
    ref : 'Brew',
    localField : '_id',
    foreignField : 'owner' 
})

const WorkspaceM = mongoose.model('WorkspaceM', WorkspaceMSchema)
module.exports =  WorkspaceM