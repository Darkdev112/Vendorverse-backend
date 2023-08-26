const express = require('express')
const router = express.Router()
const auth = require('../middlewares/auth')

const {manufacturerController}  = require('../controllers')

router.post('/placeOrderM',auth, manufacturerController.placeOrder)
router.get('/getInventoryM',auth, manufacturerController.getInventory)
router.get('/getStructuresM',auth, manufacturerController.getStructures)
router.patch('/addStructureM',auth, manufacturerController.addStructure)
router.post('/makeProductM',auth,manufacturerController.makeProduct)
router.get('/getProductsM',auth, manufacturerController.getProducts)
router.get('/getProductM/:productId',auth, manufacturerController.getProduct)
router.patch('/setRawItemM/:productId',auth, manufacturerController.setRawItem)
router.patch('/setStructureItemM/:productId',auth, manufacturerController.setStructureItem)
router.patch('/setTimeItemM/:productId',auth, manufacturerController.setTimeItem)
router.patch('/startBrewingItemM/:productId',auth, manufacturerController.startBrewingItem)
router.patch('/moveProductM/:productId',auth, manufacturerController.moveProduct)
router.get('/getOrdersM',auth, manufacturerController.getOrders)
router.get('/getOrderM/:orderId',auth, manufacturerController.getOrder)
router.patch('/manageOrderM/:orderId',auth, manufacturerController.manageOrder)

module.exports = router