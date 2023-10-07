const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const jwt = require('jsonwebtoken')
const config = require('../../config/config')

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
    },
    tokens : [{
        type : String,
        required : true
    }]
},{
    strict : true,
    versionKey : false,
    timestamps : true
})


UserSchema.methods.generateToken = async function(){
    const user = this
    const token = jwt.sign({username : user.username, email : user.email},config.jwt_secret,{
        expiresIn : 86400
    })

    user.tokens = user.tokens.concat(token)
    await user.save()
    return token
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
    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password, 8)
    }
    next()
})


const User = mongoose.model('User', UserSchema)

module.exports = User