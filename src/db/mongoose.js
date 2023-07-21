const mongoose = require("mongoose")

mongoose.connect(process.env.MONGO_URI,{
    useNewUrlParser : true,
    useUnifiedTopology : true,
}).then(() => {
    console.log("Connected to Database");
}).catch((error) => {
    console.log("Database connection error", error);
})