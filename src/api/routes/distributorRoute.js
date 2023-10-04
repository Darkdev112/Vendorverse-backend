const express = require('express')
const {distributorController}  = require('../controllers')
const {auth} = require('../middlewares')

const router = express.Router()

router.post('/placeOrderD',auth, distributorController.placeOrder)
router.get('/getSentOrdersD',auth, distributorController.getSentOrders)
router.get('/getOrderD/:orderId',auth, distributorController.getOrder)
router.delete('/removeSentOrderD/:orderId',auth, distributorController.removeSentOrder)
router.patch('/paySentOrderD/:orderId',auth, distributorController.paySentOrder)
router.patch('/moveOrderD/:orderId',auth, distributorController.moveOrder)
router.get('/getInventoryD',auth, distributorController.getInventory)
router.get('/getReceivedOrdersD',auth, distributorController.getReceivedOrders)
router.patch('/manageOrderD/:orderId',auth, distributorController.manageOrder)
router.patch('/dispatchOrderD/:orderId',auth, distributorController.dispatchOrder)


module.exports = router