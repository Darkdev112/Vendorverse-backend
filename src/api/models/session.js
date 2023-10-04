const mongoose = require('mongoose')

const sessionSchema =  new mongoose.Schema({
    sessionToken : {
        type : String,
        required : true,
    },
    expiresAt : {
        type : Number,
        required : true,
    },
    userId : {
        type : mongoose.Schema.Types.ObjectId,
        required : true,
        ref : 'User'
    }
},{
    strict : true,
    versionKey : false,
    timestamps : true
})

const Session = mongoose.model('Session', sessionSchema)
module.exports = Session