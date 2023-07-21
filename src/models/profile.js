const mongoose = require('mongoose')
const User = require('./user')

const ProfileSchema =  new mongoose.Schema({
    email:{
        type : String,
        required : true
    },
    fullname : {
        type : String,
    },
    profilePic : {
        type : String,
    },
    noofconnections : {
        type : Number,
        default : 0
    },
    projects : {
        type : Number,
        default : 0
    },
    stocks : {
        type : Number,
        default : 0
    },
    connections : [{
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Profile'
    }],
    requests : [{
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Profile'
    }],
    occupation : {
        type : String,
    },
    position : {
        type : String
    },
    location :{
        type : String
    },
    work : {
        type : String
    },
    phone : {
        type : Number
    },
    linkedIn :{
        type : String
    },
    twitter :{
        type : String        
    }
},{
    strict : true,
    versionKey : false,
    timestamps : true
})

ProfileSchema.statics.findOrCreate = async function(email){
    let receiver = await Profile.findOne({email});
    const user = await User.findOne({email})
    if(!user){
        throw new Error('User not found')
    }
    if(!receiver){
        receiver = new Profile({email})
        await receiver.save()
    }
    return receiver;
}

const Profile = mongoose.model('Profile', ProfileSchema)
module.exports = Profile