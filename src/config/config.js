const path = require('path')
const dotenv = require('dotenv').config({path : path.join(__dirname, '../../.env')})

if(dotenv.error){
    throw new Error('No .env file found')
}

module.exports = {
    mode : process.env.NODE_ENV,
    port : parseInt(process.env.PORT, 10),
    mongo_url : process.env.NODE_ENV === "test" ? `${process.env.MONGO_URL}-${process.env.NODE_ENV}` : process.env.MONGO_URL,
    client_url : process.env.CLIENT_URL,
    jwt_secret : process.env.JWT_SECRET
} 