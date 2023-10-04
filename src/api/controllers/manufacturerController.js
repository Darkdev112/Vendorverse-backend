const { WorkspaceM, Order, Inventory, Brew } = require('../models')
const { asyncErrorHandler } = require('../helpers')
const { loadAgenda } = require('../../db/agenda')

const placeOrder = asyncErrorHandler(async (req, res) => {
    const { product_name, product_quantity, cost_per_unit, expires_in } = req.body
    const workspace = await WorkspaceM.findOne({ email: req.auth.user.email })
    const product_expiry = new Date(Date.now() + expires_in * 24 * 60 * 60 * 1000)

    if (workspace.vendorPoints - (cost_per_unit * product_quantity) < 0) {
        return res.status(200).send({ msg: "insufficients funds" })
    }
    workspace.vendorPoints = workspace.vendorPoints - (cost_per_unit * product_quantity)

    const rawItem = new Inventory({
        product_name,
        product_quantity,
        product_expiry,
        cost_per_unit,
        ownerSelect: "WorkspaceM",
        owner: workspace._id,
        item_type: "raw"
    })

    await rawItem.save()
    await workspace.save()
    res.status(200).send({ rawItem })
})

const getInventory = asyncErrorHandler(async (req, res) => {
    const workspace = await WorkspaceM.findOne({ email: req.auth.user.email })

    await workspace.populate({ path: 'inventory' })
    res.status(200).send({ inventory: workspace.inventory })
})

const getStructures = asyncErrorHandler(async (req, res) => {
    const workspace = await WorkspaceM.findOne({ email: req.auth.user.email })
    res.status(200).send({ structures: workspace.structures })
})

const addStructure = asyncErrorHandler(async (req, res) => {
    const { structure_name, structure_quantity, cost_per_unit } = req.body
    const workspace = await WorkspaceM.findOne({ email: req.auth.user.email })
    const existingStructure = workspace.structures.find((struct) => struct.structure_name === structure_name)

    if (workspace.vendorPoints - (cost_per_unit * structure_quantity) < 0) {
        return res.status(200).send({ msg: "insufficients funds" })
    }
    workspace.vendorPoints = workspace.vendorPoints - cost_per_unit * structure_quantity

    if (!existingStructure) {
        workspace.structures.push({ structure_name, structure_quantity, cost_per_unit })
        await workspace.save()
        return res.status(200).send({ structures: workspace.structures })
    }

    workspace.structures.forEach((struct) => {
        if (struct.structure_name === structure_name) {
            struct.structure_quantity = struct.structure_quantity + structure_quantity
        }
    })

    await workspace.save()
    res.status(200).send({ structures: workspace.structures })
})


const makeProduct = asyncErrorHandler(async (req, res) => {
    const { product_name, product_quantity, expires_in, product_details } = req.body;
    const workspace = await WorkspaceM.findOne({ email: req.auth.user.email })
    const product = new Brew({
        product_name,
        product_details,
        expires_in,
        product_expiry: new Date(Date.now() + expires_in * 24 * 60 * 60 * 1000),
        product_quantity,
        owner: workspace._id
    })

    await product.save()
    await workspace.populate('products')
    res.status(200).send({ products: workspace.products })
})

const getProducts = asyncErrorHandler(async (req, res) => {
    const workspace = await WorkspaceM.findOne({ email: req.auth.user.email })
    await workspace.populate('products')
    res.status(200).send({ products: workspace.products })
})

const getProduct = asyncErrorHandler(async (req, res) => {
    const id = req.params.productId;
    const product = await Brew.findById(id);

    if (product) {
        res.status(200).send({ product });
    }
    else {
        res.status(404).send({ error: " No such order is issued" })
    }
})

const setRawItem = asyncErrorHandler(async (req, res) => {
    const id = req.params.productId;
    const workspace = await WorkspaceM.findOne({ email: req.auth.user.email })
    const product = await Brew.findById(id);

    if (product.status !== "new") {
        return res.status(200).send({ msg: "already started brewing" })
    }
    const { product_name, product_quantity, step } = req.body;
    await workspace.populate('inventory')

    const isAvailable = workspace.inventory.find((item) => {
        return product_name === item.product_name && product_quantity <= item.product_quantity && item.item_type === "raw"
    })

    if (!isAvailable) {
        return res.status(200).send({ msg: "Not such item present" })
    }

    const foundItem = await Inventory.findOne({ _id: isAvailable._id })
    foundItem.product_quantity = foundItem.product_quantity - product_quantity
    product.items.push({ product_name, product_quantity, cost_per_unit: foundItem.cost_per_unit, step })

    await product.save()
    await foundItem.save()
    res.status(200).send({ msg: "item successfully entered", foundItem, product })
})

const setStructureItem = asyncErrorHandler(async (req, res) => {
    let flag = 0;
    const id = req.params.productId;
    const workspace = await WorkspaceM.findOne({ email: req.auth.user.email })
    const product = await Brew.findById(id);

    if (product.status !== "new") {
        return res.status(200).send({ msg: "already started brewing" })
    }
    const { structure_name, structure_quantity, step } = req.body;

    workspace.structures.forEach((struct) => {
        if (structure_name === struct.structure_name && structure_quantity <= struct.structure_quantity) {
            flag = 1;
            struct.structure_quantity = struct.structure_quantity - structure_quantity
        }
    })

    if (flag === 0) {
        return res.status(200).send({ msg: "No such structure present" })
    }

    product.structures.push({ structure_name, structure_quantity, step })

    await product.save()
    await workspace.save()
    res.status(200).send({ msg: "structure successfully entered", product })
})

const setTimeItem = asyncErrorHandler(async (req, res) => {
    const id = req.params.productId;
    const product = await Brew.findById(id);

    if (product.status !== "new") {
        return res.status(200).send({ msg: "already started brewing" })
    }

    const { time, step } = req.body;

    product.time_taken.push({ time, step })
    await product.save();
    res.status(200).send({ msg: "time stored", product })
})

const startBrewingItem = asyncErrorHandler(async (req, res) => {
    const id = req.params.productId;
    const product = await Brew.findById(id);
    const workspace = await WorkspaceM.findOne({ email: req.auth.user.email })
    const agenda = loadAgenda()

    if (product.status != "new") {
        return res.status(200).send({ msg: "Brewing already happened" })
    }
    else {
        product.status = "pending"
        product.cost_per_unit = 0
    }

    if (product.items.length <= 1 || product.structures.length === 0) {
        return res.status(200).send({ msg: "Not sufficient items" })
    }

    product.items.sort((a, b) => {
        return b.step - a.step
    })
    product.structures.sort((a, b) => {
        return b.step - a.step
    })
    product.time_taken.sort((a, b) => {
        return a.step - b.step
    })

    const jobs = product.time_taken.map((item, index) => {
        return agenda.define(`Step ${item.step}`, async () => {
            // console.log("start");
            while (product.items.length !== 0 && product.items[product.items.length - 1].step === item.step) {
                const pro = product.items.pop()
                console.log(pro);
                product.cost_per_unit = product.cost_per_unit + (pro.cost_per_unit * pro.product_quantity)

            }
            while (product.structures.length !== 0 && product.structures[product.structures.length - 1].step === item.step) {
                const current_structure = product.structures.pop()
                // console.log(current_structure);
                workspace.structures.forEach((struct) => {
                    if (struct.structure_name === current_structure.structure_name) {
                        struct.structure_quantity = struct.structure_quantity + current_structure.structure_quantity
                    }
                })
            }
            if (index == product.time_taken.length - 1) {
                // console.log("complete");
                product.status = "completed"
                product.cost_per_unit = product.cost_per_unit / product.product_quantity
            }
            await product.save()
            await workspace.save()
        })
    })

    await agenda.start();

    product.time_taken.forEach(async (item) => {
        await agenda.schedule(`${item.time} seconds`, `Step ${item.step}`);
    })

    res.status(200).send({ product, workspace })
})

const moveProduct = asyncErrorHandler(async (req, res) => {
    const id = req.params.productId;
    const workspace = await WorkspaceM.findOne({ email: req.auth.user.email })
    const product = await Brew.findById(id);

    if (product.status === "completed") {
        const item = new Inventory({
            product_name: product.product_name,
            product_quantity: product.product_quantity,
            product_details: product.product_details,
            product_expiry: new Date(Date.now() + product.expires_in * 24 * 60 * 60 * 1000),
            cost_per_unit: product.cost_per_unit,
            ownerSelect: "WorkspaceM",
            owner: workspace._id,
            item_type: "processed"
        })
        await product.deleteOne();
        await item.save();
        res.status(200).send({ msg: "saved to inventory", workspace })
    }
    else {
        return res.status(200).send({ msg: "Product not ready" })
    }
})

const getOrders = asyncErrorHandler(async (req, res) => {
    const workspace = await WorkspaceM.findOne({ email: req.auth.user.email })
    await workspace.populate({ path: 'orders' })
    res.status(200).send({ orders: workspace.orders })
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

const manageOrder = asyncErrorHandler(async (req, res) => {
    const id = req.params.orderId
    const choice = req.query.status
    const workspace = await WorkspaceM.findOne({ email: req.auth.user.email })
    const order = await Order.findById(id)

    if (order.status === "new") {
        if (choice === 'false') {
            order.status = "rejected"
            await order.save()
            return res.status(200).send({ msg: "Order rejected" })
        }
        await workspace.populate({ path: 'inventory' })
        const returnedItem = workspace.inventory.find((item) => {
            return order.product_name === item.product_name && order.product_quantity <= item.product_quantity && item.item_type === "processed"
        })

        if (!returnedItem) {
            return res.status(200).send({ msg: "Item not in inventory please make an product now" })
        }

        const foundItem = await Inventory.findOne({ _id: returnedItem._id })
        foundItem.product_quantity = foundItem.product_quantity - order.product_quantity

        order.product_details = foundItem.product_details
        order.product_expiry = foundItem.product_expiry
        order.to_pay = foundItem.cost_per_unit * order.product_quantity
        order.status = "pending"

        await foundItem.save()
        await order.save()
        res.status(200).send({ msg: 'Order accepted now please make the payment', foundItem, order })
    }
})


module.exports = {
    placeOrder,
    getInventory,
    getStructures,
    addStructure,
    makeProduct,
    getProducts,
    getProduct,
    setRawItem,
    setStructureItem,
    setTimeItem,
    startBrewingItem,
    moveProduct,
    getOrders,
    getOrder,
    manageOrder
}

