const express = require('express')
const {adminController}  = require('../controllers')

const router = express.Router()

router.delete('/cleanInventory', adminController.cleanInventory)
router.patch('/cleanJobs', adminController.cleanJobs)
router.patch('/resumeJob', adminController.resumeJob)

module.exports = router