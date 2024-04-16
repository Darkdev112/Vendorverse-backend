const { Profile, WorkspaceR, Order, Inventory, WorkspaceD } = require('../models')
const { asyncErrorHandler } = require('../helpers');

const placeOrder = asyncErrorHandler(async (req, res) => {
    const { product_name, product_quantity, email } = req.body;

    const workspace = await WorkspaceR.findOne({ email: req.auth.user.email })
    const workspaceD = await WorkspaceD.findOne({ email })

    const profileR = await Profile.findOne({ email : req.auth.user.email})
    const profileD = await Profile.findOne({ email})


    if(!workspaceD){
        return res.status(200).send({error : 'Could not find user'})
    }
    
    const common = profileR.connections.map((connection,index) => {
        if(connection.equals(profileD.id)){
            return connection
        }
    })
    
    if(!common[0]){
        return res.status(200).send({error : 'Not a connection yet'})
    }

    const order = new Order({
        product_name,
        product_quantity,
        fromSelect: "WorkspaceD",
        forSelect: "WorkspaceR",
        from: workspaceD._id,
        for: workspace._id
    })
    await order.save();

    await workspace.populate('orders')
    res.status(200).send({ orders: workspace.orders });
})

const getOrders = asyncErrorHandler(async (req, res) => {
    const workspace = await WorkspaceR.findOne({ email: req.auth.user.email })

    await workspace.populate({ path: 'orders' })
    res.status(200).send({ orders: workspace.orders })
})

const getOrder = asyncErrorHandler(async (req, res) => {
    const id = req.params.orderId;
    console.log(id);
    const order = await Order.findById(id);
    if (order) {
        res.status(200).send({ order });
    }
    else {
        res.status(404).send({ error: " No such order is issued" })
    }
})

const removeOrder = asyncErrorHandler(async (req, res) => {
    const id = req.params.orderId;
    const order = await Order.findById(id) // just to check the response'

    if (order.status == "rejected") {
        const deletedOrder = await Order.findByIdAndDelete(id);
        return res.status(200).send({ msg: "Order deleted", order: deletedOrder })
    }
    res.status(200).send({ msg: "Could not be deleted", order })
})

const payOrder = asyncErrorHandler(async (req, res) => {
    const id = req.params.orderId;
    const workspace = await WorkspaceR.findOne({ email: req.auth.user.email })
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
})

const trackOrder = asyncErrorHandler(async (req, res) => {
    const id = req.params.orderId
    const workspace = await WorkspaceR.findOne({ email: req.auth.user.email })
    const order = await Order.findById(id);

    const { speed, time, distance } = order.delivery;
    if (order.delivery.status === "new") {
        return res.status(200).send({ status: "Not yet dispatched" })
    }
    else if (order.delivery.status === "dispatch") {
        const position = speed * ((Date.now() - time) / 3600000)
        if (position >= distance) {
            order.delivery.status = "completed"
            order.status = "completed"
            await order.save();
            return res.status(200).send({ status: "Successfully completed" })
        }
        else {
            return res.status(200).send({ status: "Already Dispatched" })
        }
    }
    else {
        res.status(200).send({ status: "Successfully completed" })
    }
})

const moveInventory = asyncErrorHandler(async (req, res) => {
    const id = req.params.orderId;
    const workspace = await WorkspaceR.findOne({ email: req.auth.user.email })
    const order = await Order.findById(id);

    if (order.status === "completed") {
        const item = new Inventory({
            product_name: order.product_name,
            product_quantity: order.product_quantity,
            product_details: order.product_details,
            product_expiry: order.product_expiry,
            cost_per_unit: order.to_pay / order.product_quantity,
            ownerSelect: "WorkspaceR",
            owner: workspace._id,
        })
        await order.deleteOne();
        await item.save();
        res.status(200).send({ msg: "Item added to inventory", item })
    }
    else {
        res.status(400).send({ error: "Product not ready" })
    }
})


const getInventory = asyncErrorHandler(async (req, res) => {
    const workspace = await WorkspaceR.findOne({ email: req.auth.user.email })

    await workspace.populate({ path: 'inventory' })
    res.status(200).send({ inventory: workspace.inventory })
})

module.exports = {
    placeOrder,
    getOrders,
    getOrder,
    removeOrder,
    payOrder,
    trackOrder,
    moveInventory,
    getInventory
}
