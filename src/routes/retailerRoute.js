const express = require('express')
const router = express.Router()
const auth = require('../middlewares/auth')

const {retailerController}  = require('../controllers')

router.post('/placeOrderR',auth, retailerController.placeOrder)
router.get('/getOrdersR',auth, retailerController.getOrders)
router.get('/getOrderR/:orderId',auth, retailerController.getOrder)
router.delete('/removeOrderR/:orderId',auth, retailerController.removeOrder)
router.patch('/payOrderR/:orderId',auth, retailerController.payOrder)
router.patch('/trackOrderR/:orderId',auth, retailerController.trackOrder)
router.patch('/moveInventoryR/:orderId',auth, retailerController.moveInventory)
router.get('/getInventoryR',auth, retailerController.getInventory)

module.exports = router