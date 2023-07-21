const express = require('express')
const router = express.Router()
const auth = require('../middlewares/auth')


const {userController} = require('../controllers')

router.post('/login', userController.login)
router.post('/signup', userController.signup)
router.get('/getUser',auth, userController.getUser)
router.delete('/logout', auth, userController.logout)

module.exports = router
