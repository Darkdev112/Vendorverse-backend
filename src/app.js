const path = require('path')
const dotenv = require('dotenv').config({path : path.join(__dirname , '../config/dev.env')})
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const {userRoute, profileRoute, retailerRoute, distributorRoute, manufacturerRoute} = require('./routes')

require('./db/mongoose')
const app = express()

app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
}))

app.use(userRoute);
app.use(profileRoute);
app.use(retailerRoute);
app.use(distributorRoute);
app.use(manufacturerRoute)

app.get('/', async (req,res) => {
    res.status(200).send("Express App")
})


module.exports= app