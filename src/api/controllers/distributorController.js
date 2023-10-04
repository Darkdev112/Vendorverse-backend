const mongoose = require('mongoose');
const { WorkspaceD, Order, Inventory, WorkspaceM } = require('../models')
const { asyncErrorHandler, CustomError } = require('../helpers')

const placeOrder = asyncErrorHandler(async (req, res) => {
    const { product_name, product_quantity, isOrder, email, order_of_now } = req.body;

    const order_of = new mongoose.Types.ObjectId(order_of_now)
    const workspace = await WorkspaceD.findOne({ email: req.auth.user.email })
    const workspaceM = await WorkspaceM.findOne({ email })
    let targetOrder;

    if (isOrder) {
        targetOrder = await Order.findOne({ _id: order_of })
    }

    const options = isOrder ? {
        product_name: targetOrder.product_name,
        product_quantity: targetOrder.product_quantity,
        fromSelect: "WorkspaceM",
        forSelect: "WorkspaceD",
        from: workspaceM._id,
        for: workspace._id,
        isOrder,
        order_of,
    } : {
        product_name,
        product_quantity,
        fromSelect: "WorkspaceM",
        forSelect: "WorkspaceD",
        from: workspaceM._id,
        for: workspace._id,
        isOrder
    }
    const order = new Order(options)
    await order.save();

    await workspace.populate({ path: 'sent_orders' })
    res.status(200).send({ orders: workspace.sent_orders });
})

const getSentOrders = asyncErrorHandler(async (req, res) => {
    const workspace = await WorkspaceD.findOne({ email: req.auth.user.email })

    await workspace.populate({ path: 'sent_orders' })
    res.status(200).send({ orders: workspace.sent_orders })
})

const getOrder = asyncErrorHandler(async (req, res) => {
    const id = req.params.orderId;
    const order = await Order.findById(id);

    if (order) {
        res.status(200).send({ order });
    }
    else {
        res.status(404).send({ error: " No such order is issued" })
    }
})

const removeSentOrder = asyncErrorHandler(async (req, res) => {
    const id = req.params.orderId;
    const order = await Order.findById(id) // just to check the response'

    if(!order){
        throw new CustomError('Not found',404)
    }

    if (order.status == "rejected") {
        const deletedOrder = await Order.findByIdAndDelete(id);
        return res.status(200).send({ msg: "Order deleted", order: deletedOrder })
    }
    res.status(200).send({ msg: "Could not be deleted", order })
})

const paySentOrder = asyncErrorHandler(async (req, res) => {
    const id = req.params.orderId;
    const workspace = await WorkspaceD.findOne({ email: req.auth.user.email })
    const order = await Order.findById(id);

    if (order.status === "pending" && !order.has_paid) {
        if (workspace.vendorPoints < order.to_pay) {
            return res.status(200).send({ msg: "Insufficients funds" })
        }
        workspace.vendorPoints = workspace.vendorPoints - order.to_pay
        order.has_paid = true
        order.status = "completed"
        await workspace.save()
        await order.save()
        return res.status(200).send({ msg: "Payment made", order: order, workspace: workspace })
    }
    else if (order.has_paid) {
        return res.status(200).send({ msg: "Already paid" })
    }
    else {
        return res.status(200).send({ msg: "Status is not pending" })
    }
})

const moveOrder = asyncErrorHandler(async (req, res) => {
    const id = req.params.orderId;
    const workspace = await WorkspaceD.findOne({ email: req.auth.user.email })
    const order = await Order.findById(id);

    if (order.status === "completed" && !order.isOrder) {
        const item = new Inventory({
            product_name: order.product_name,
            product_quantity: order.product_quantity,
            product_details: order.product_details,
            product_expiry: order.product_expiry,
            cost_per_unit: order.to_pay / order.product_quantity,
            ownerSelect: "WorkspaceD",
            owner: workspace._id,
        })
        await order.deleteOne();
        await item.save();
        res.status(200).send({ msg: "saved to inventory", workspace })
    }
    else if (order.status === "completed" && order.isOrder) {
        const targetOrder = await Order.findOne({ _id: order.order_of })

        const increase = req.body.incremental_cost ? req.body.incremental_cost : 0;

        targetOrder.product_details = order.product_details
        targetOrder.product_expiry = order.product_expiry
        targetOrder.to_pay = order.to_pay + increase * order.product_quantity
        targetOrder.status = "pending"

        await order.deleteOne();
        await targetOrder.save();
        res.status(200).send({ msg: "target order updated", targetOrder })
    }
    else {
        return res.status(200).send({ msg: "Product not ready" })
    }
})

const getInventory = asyncErrorHandler(async (req, res) => {
    const workspace = await WorkspaceD.findOne({ email: req.auth.user.email })

    await workspace.populate({ path: 'inventory' })
    res.status(200).send({ inventory: workspace.inventory })
})

const getReceivedOrders = asyncErrorHandler(async (req, res) => {
    const workspace = await WorkspaceD.findOne({ email: req.auth.user.email })
    await workspace.populate({ path: 'received_orders' })
    res.status(200).send({ orders: workspace.received_orders })
})


const manageOrder = asyncErrorHandler(async (req, res) => {
    const id = req.params.orderId
    const choice = req.query.status
    const workspace = await WorkspaceD.findOne({ email: req.auth.user.email })
    const order = await Order.findById(id)

    if (order.status === "new") {
        if (choice === 'false') {
            order.status = "rejected"
            await order.save()
            return res.status(200).send({ msg: "Order rejected" })
        }
        await workspace.populate({ path: 'inventory' })
        const returnedItem = workspace.inventory.find((item) => {
            return order.product_name === item.product_name && order.product_quantity <= item.product_quantity
        })

        if (!returnedItem) {
            return res.status(200).send({ msg: "Item not in inventory please make an order and give its order id in the order" })
        }

        const foundItem = await Inventory.findOne({ _id: returnedItem._id })
        foundItem.product_quantity = foundItem.product_quantity - order.product_quantity

        order.product_details = foundItem.product_details
        order.product_expiry = foundItem.product_expiry
        order.to_pay = (foundItem.cost_per_unit + foundItem.incremental_cost) * order.product_quantity
        order.status = "pending"

        await foundItem.save()
        await order.save()
        res.status(200).send({ msg: 'Order accepted now please make the payment', foundItem, order })
    }
})

const dispatchOrder = asyncErrorHandler(async (req, res) => {
    const id = req.params.orderId;
    const order = await Order.findById(id);

    if (order.status === "pending" && order.has_paid && order.delivery.status === "new") {
        order.delivery = {
            status: "dispatch",
            distance: req.body.distance,
            time: Date.now(),
            speed: req.body.speed,
        }
        await order.save();
        return res.status(200).send({ msg: "order dispatched", order })
    }
    else if (order.delivery.status === "dispatch") {
        return res.status(200).send({ msg: "Already dispatched" })
    }
    else if (!order.has_paid) {
        return res.status(200).send({ msg: "Please pay first" })
    }
    else {
        res.status(200).send({ msg: "Order not ready yet" })
    }
})

module.exports = {
    placeOrder,
    getSentOrders,
    getOrder,
    removeSentOrder,
    paySentOrder,
    moveOrder,
    getInventory,
    getReceivedOrders,
    manageOrder,
    dispatchOrder
}
