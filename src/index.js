const express = require('express')
const config = require('./config/config')
const logger = require('./config/logger')
const connectDB = require('./db');
const appLoader = require('./app');
const { loadAgenda } = require('./db/agenda');

async function startServer(){
    const app = express()
    await connectDB()
    await appLoader(app)

    const server = app.listen(config.port, () => {
        logger.info(`Server up on port ${config.port}`);
    })

    const graceful = async () => {
        const agenda = loadAgenda()
        await agenda.stop()
    }

    const unexpectedErrorHandler = async (error) => {
        logger.error(error)
        await graceful()
        if (server) {
            server.close(() => {
                logger.info("Server closed")
                process.exit(1)
            })
        }
        else {
            process.exit(1)
        }
    }

    process.on("uncaughtException", unexpectedErrorHandler)
    process.on("unhandledRejection", unexpectedErrorHandler)
    process.on("SIGTERM", unexpectedErrorHandler);
    process.on("SIGINT", unexpectedErrorHandler);
}

startServer()