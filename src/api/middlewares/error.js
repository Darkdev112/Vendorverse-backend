const config = require('../../config/config')
const {CustomError} = require('../helpers')

const castErrorHandler = (error) => {
    const msg = `Invalid value for ${error.path} : ${error.value}`
    return new CustomError(msg,400)
}

const duplicateKeyErrorHandler = (error) => {
    const msg = `Already used inputs` 
    return  new CustomError(msg)
}

const validationErrorHandler = (error) => {
    const errors = Object.values(error.errors).map(val => val.message)
    const errorMessages = errors.join('. ')
    const msg = `Invalid input data : ${errorMessages}`
    return new CustomError(msg,400)
}

const devError = (res,error) => {
    res.status(error.statusCode).json({
        status : error.status,
        message : error.message,
        stackTrace : error.stack,
        error : error
    })
}

const prodError = (res,error) => {
    if(error.isOperational){    
        res.status(error.statusCode).json({
            status : error.statusCode,
            message : error.message
        })
    }
    else{
        res.status(500).json({
            status : 'error',
            message : 'Something went wrong'
        })
    }
}


const globalErrorHandler = (error,req,res,next) => {
    error.statusCode = error.statusCode || 500
    error.status = error.status || 'error'

    if(config.mode === 'development'){
        devError(res,error)
    }
    else if(config.mode === 'production'){
        if(error.name === 'CastError'){
            error = castErrorHandler(error)
        }
        if(error.code === 11000){
            error = duplicateKeyErrorHandler(error)
        }
        if(error.name === 'ValidationError'){
            error = validationErrorHandler(error)
        }
        prodError(res,error)
    }
    else{
        devError(res,error)
    }
}

module.exports = globalErrorHandler