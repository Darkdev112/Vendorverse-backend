const mongoose = require("mongoose")
const logger = require('../config/logger')

const connectDB = async () => {
    try {
        const connection = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
        if(connection){
            logger.info('Database Connected')
        }
    } catch (error) {
        console.log(error)
        logger.error('Database Connection error')
        process.exit(1)
    }
}

module.exports = connectDB