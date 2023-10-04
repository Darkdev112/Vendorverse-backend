const { User, Session } = require('../models')
const { CustomError } = require('../helpers')

const auth = async (req, res, next) => {
    try {
        const sessionToken = req.headers.authorization
        const session = await Session.findOne({ sessionToken })

        if (!session) {
            throw new CustomError('Unauthorised Error', 401)
        }

        if (session.expiresAt < ((new Date()).getTime())) {
            await Session.findByIdAndDelete(session._id)
            throw new CustomError('Unauthorised Error', 401)
        }

        await session.populate('userId')

        req.auth = {
            user: session.userId,
            sessionToken: sessionToken
        }
        next()
    } catch (error) {
        next(error)
    }
}

module.exports = auth