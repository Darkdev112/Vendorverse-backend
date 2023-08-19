const { WorkspaceD, Order, Inventory, WorkspaceM } = require('../models')

const placeOrder = async (req, res) => {
    try {
        const { product_name, product_quantity, isOrder, email, order_of } = req.body;
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
    } catch (error) {
        res.status(400).send({ error })
    }
}

const getSentOrders = async (req, res) => {
    try {
        const workspace = await WorkspaceD.findOne({ email: req.auth.user.email })

        await workspace.populate({ path: 'sent_orders' })
        res.status(200).send({ orders: workspace.sent_orders })
    } catch (error) {
        res.status(400).send({ error })
    }
}

const getOrder = async (req, res) => {
    try {
        const id = req.params.orderId;
        const order = await Order.findById(id);

        if (order) {
            res.status(200).send({ order });
        }
        else {
            res.status(404).send({ error: " No such order is issued" })
        }
    } catch (error) {
        res.status(400).send({ error })
    }
}

const removeSentOrder = async (req, res) => {
    try {
        const id = req.params.orderId;
        const order = await Order.findById(id) // just to check the response'

        if (order.status == "rejected") {
            const deletedOrder = await Order.findByIdAndDelete(id);
            return res.status(200).send({ msg: "Order deleted", order: deletedOrder })
        }
        res.status(200).send({ msg: "Could not be deleted", order })
    } catch (error) {
        res.status(400).send({ error })
    }
}

const paySentOrder = async (req, res) => {
    try {
        const id = req.params.orderId;
        const workspace = await WorkspaceD.findOne({ email: req.auth.user.email })
        const order = await Order.findById(id);

        if (order.status === "pending" && !order.has_paid) {
            if (workspace.vendorPoints < order.to_pay) {
                return res.status(200).send({ msg: "Insufficients funds" })
            }
            workspace.vendorPoints = workspace.vendorPoints - order.to_pay
            order.has_paid = true
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
    } catch (error) {
        res.status(400).send({ error })
    }
}

const moveOrder = async (req, res) => {
    try {
        const id = req.params.orderId;
        const workspace = await WorkspaceD.findOne({ email: req.auth.user.email })
        const order = await Order.findById(id);

        if (order.status === "completed" && !order.isOrder) {
            const item = new Inventory({
                product_name: order.product_name,
                product_quantity: order.product_quantity,
                product_description: order.product_description,
                product_expiry: order.product_expiry,
                cost_per_unit: order.to_pay / order.product_quantity,
                ownerSelect: "WorkspaceD",
                owner: workspace._id,
            })
            await order.deleteOne();
            await workspace.save();
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
            return res.status(400).send({ error: "Product not ready" })
        }
    } catch (error) {
        return res.status(400).send({ error })
    }
}

const getInventory = async (req, res) => {
    try {
        const workspace = await WorkspaceD.findOne({ email: req.auth.user.email })
        const inventory = await workspace.populate({ path: 'inventory' })
        res.status(200).send({ inventory })
    } catch (error) {
        res.status(400).send({ error })
    }
}

const getReceivedOrders = async (req, res) => {
    try {
        const workspace = await WorkspaceD.findOne({ email: req.auth.user.email })
        await workspace.populate({ path: 'received_orders' })
        res.status(200).send({ orders: workspace.received_orders })
    } catch (error) {
        res.status(400).send({ error })
    }
}


const manageOrder = async (req, res) => {
    try {
        const id = req.params.orderId
        const status = req.query.status
        const workspace = await WorkspaceD.findOne({ email: req.auth.user.email })
        const order = await Order.findById(id)

        if (order.status === "new") {
            if (status === 'false') {
                order.status = "rejected"
                await order.save()
                return res.status(200).send({ msg: "Order rejected" })
            }
            await workspace.populate({ path: 'inventory' })
            const returnedItem = workspace.inventory.find((item) => {
                return order.product_name === item.product_name && order.product_quantity <= item.product_quantity
            })
            
            if(!returnedItem){
                res.status(200).send({ msg: "Item not in inventory please make an order and give its order id in the order"})
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
    } catch (error) {
        res.status(400).send({ error })
    }
}

const dispatchOrder = async (req, res) => {
    try {
        const id = req.params.orderId;
        const order = await Order.findById(id);

        if (order.status === "pending" && order.has_paid && order.delivery.status === "new") {
            order.delivery = {
                status : "dispatch",
                distance : req.body.distance,
                time : Date.now(),
                speed : req.body.speed,
            }
            await order.save();
            return res.status(200).send({msg: "order dispatched", order})
        }
        else if(order.status ==="pending" && !order.has_paid){
            return res.status(200).send({msg : "Please pay first first"})
        }
        else {
            res.status(200).send({ error: " No such order is issued" })
        }
    } catch (error) {
        res.status(400).send({ error })
    }
}

module.exports = {
    placeOrder,
    getSentOrders,
    getOrder,
    removeSentOrder,
    paySentOrder,
    moveOrder,
    getInventory
}
