const Agenda = require('agenda')
const logger = require('../config/logger')

const loadAgenda = () => {
    try {
        const agenda = new Agenda({db : {address : process.env.MONGO_URI, collection : 'agenda'}})
        return agenda
    } catch (error) {
        logger.error('Agenda Connection Error')
        process.exit(1)     
    }
}

module.exports = {loadAgenda}