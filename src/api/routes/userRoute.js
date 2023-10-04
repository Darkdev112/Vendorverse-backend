const express = require('express')
const {userController} = require('../controllers')
const {auth} = require('../middlewares')

const router = express.Router()

router.post('/login', userController.login)
router.post('/signup', userController.signup)
router.get('/getUser',auth, userController.getUser)
router.delete('/logout', auth, userController.logout)

module.exports = router
