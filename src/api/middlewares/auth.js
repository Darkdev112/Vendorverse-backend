const jwt = require('jsonwebtoken')
const {User} = require('../models')
const config = require('../../config/config')
const { CustomError } = require('../helpers')

const auth = async (req, res, next) => {
    try {
        const authToken = req.headers.authorization
        if(!authToken || !authToken.startsWith('Bearer ')){
            throw new CustomError('Unauthorised Error', 401)
        }
        const token = authToken.split(' ')[1]
        const {email}= jwt.verify(token, config.jwt_secret)

        const user = await User.findOne({email, tokens : token})
        if(!user){
            throw new CustomError('Unauthorised Error', 401)
        }

        req.auth = {
            user,
            token
        }
        next()
    } catch (error) {
        next(error)
    }
}

module.exports = auth