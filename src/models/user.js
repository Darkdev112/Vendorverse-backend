const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const uuid = require('uuid')
const Session = require("./session")

const UserSchema = new mongoose.Schema({
    username : {
        type : String,
        required : true,
        trim : true,
    },
    email : {
        type : String,
        required : true,
        unique : true,
        lowercase : true,
    },
    password : {
        type : String,
        required : true,
        trim : true,
        minLength : 6
    },
    occupation : {
        type : String,
        required : true
    }
},{
    strict : true,
    versionKey : false,
    timestamps : true
})


UserSchema.methods.generateCookie = async function(){
    const user = this
    const sessionToken = uuid.v4();
    const date= new Date()
    const expiresAt = date.setTime(date.getTime() + ( 24 * 60 * 60 * 1000 ))
    const newSession = new Session({sessionToken, expiresAt, userId : user._id})
    await newSession.save();
    
    return newSession 
}


UserSchema.statics.findByCredentials = async(email , password) => {
    const oldUser = await User.findOne({email})
    if(!oldUser){
        throw new Error('Unable to login!')
    }

    const isValid = await bcrypt.compare(password, oldUser.password)
    if(!isValid){
        throw new Error('Unable to login')
    }

    return oldUser
}


UserSchema.pre('save', async function(next){
    const user = this
    console.log(user);
    if(user.isModified('password')){
        console.log(user.password);
        user.password = await bcrypt.hash(user.password, 8)
    }
    next()
})


const User = mongoose.model('User', UserSchema)

module.exports = User