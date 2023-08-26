const Agenda = require('agenda')
const agenda = new Agenda({db : {address : process.env.MONGO_URI, collection : 'agenda'}})
module.exports = {agenda}