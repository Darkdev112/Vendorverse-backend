const mongoose = require("mongoose")
const Agenda = require('agenda')

mongoose.connect("mongodb://127.0.0.1:27017/cookie-parser-test",{
    useNewUrlParser : true,
    useUnifiedTopology : true,
}).then(() => {
    console.log("Connected to Database");
}).catch((error) => {
    console.log("Database connection error", error);
})

const agenda = new Agenda({db : {address : "mongodb://127.0.0.1:27017/cookie-parser-test", collection : 'agendatest'}})

module.exports = {agenda}