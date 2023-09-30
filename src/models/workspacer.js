const mongoose = require('mongoose')

const WorkspaceRSchema = new mongoose.Schema({
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
        type : Number,
        default : 0
    },
},{
    strict : true,
    versionKey : false,
    timestamps : true
})

WorkspaceRSchema.virtual('orders',{
    ref : 'Order',
    localField : '_id',
    foreignField : 'for',
})

WorkspaceRSchema.virtual('inventory',{
    ref : 'Inventory',
    localField : '_id',
    foreignField : 'owner',
})


const WorkspaceR = mongoose.model('WorkspaceR', WorkspaceRSchema)
module.exports = WorkspaceR