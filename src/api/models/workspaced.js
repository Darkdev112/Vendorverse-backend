const mongoose = require('mongoose')

const WorkspaceDSchema = new mongoose.Schema({
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

WorkspaceDSchema.virtual('sent_orders',{
    ref : 'Order',
    localField : '_id',
    foreignField : 'for',
})
WorkspaceDSchema.virtual('received_orders',{
    ref : 'Order',
    localField : '_id',
    foreignField : 'from'
})
WorkspaceDSchema.virtual('inventory',{
    ref : 'Inventory',
    localField : '_id',
    foreignField : 'owner',
})

const WorkspaceD = mongoose.model('WorkspaceD', WorkspaceDSchema)
module.exports =  WorkspaceD