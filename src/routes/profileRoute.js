const express = require('express')
const router = express.Router()
const auth = require('../middlewares/auth')


const {profileController} = require('../controllers')

router.get('/getProfile',auth, profileController.getProfile)
// router.post('/createProfile',auth, profileController.createProfile)
router.patch('/updateProfile',auth, profileController.updateProfile)
router.patch('/addRequest',auth, profileController.addRequest)
router.patch('/manageRequest', auth, profileController.manageRequest)
router.get('/getRequests', auth, profileController.getRequests)
router.get('/getConnections', auth, profileController.getConnections)


module.exports = router