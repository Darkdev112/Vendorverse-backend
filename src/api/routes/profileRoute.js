const express = require('express')
const {profileController} = require('../controllers')
const {auth} = require('../middlewares')

const router = express.Router()

router.get('/getProfile',auth, profileController.getProfile)
router.patch('/updateProfile',auth, profileController.updateProfile)
router.patch('/addRequest',auth, profileController.addRequest)
router.patch('/manageRequest', auth, profileController.manageRequest)
router.get('/getRequests', auth, profileController.getRequests)
router.get('/getConnections', auth, profileController.getConnections)
router.patch('/addVendorPoints', auth, profileController.addVendorPoints)


module.exports = router