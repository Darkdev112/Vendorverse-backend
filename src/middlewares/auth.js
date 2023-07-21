const {User, Session} = require('../models')

const auth = async(req,res,next) => {
    const sessionToken = req.headers.authorization
    const session = await Session.findOne({sessionToken})
 
    if(!session){
        return res.status(401).send("Not authorised")
    }

    if(session.expiresAt < ((new Date()).getTime()))
    {
        await Session.findByIdAndDelete(session._id)
        return res.status(401).send("Not authorised")
    }

    await session.populate('userId')

    req.auth = {
        user : session.userId,
        sessionToken : sessionToken
    }
    next()
}

module.exports = auth