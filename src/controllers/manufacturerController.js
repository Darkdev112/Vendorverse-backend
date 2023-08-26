const {WorkspaceM,Order,Inventory, Brew} = require('../models')
const {agenda} = require('./db/agenda')

const placeOrder =  async (req,res) => {
    try {
        const { product_name, product_quantity, cost_per_unit , expires_in} = req.body
        const workspace = await WorkspaceM.findOne({ email:req.auth.user.email})
        const product_expiry = new Date(Date.now() + expires_in * 24 * 60 * 60 * 1000)

        if(workspace.vendorPoints<workspace.vendorPoints-(cost_per_unit * product_quantity)){
            return res.status(200).send({msg : "insufficients funds"})
        }
        workspace.vendorPoints = workspace.vendorPoints - (cost_per_unit * product_quantity)

        const  rawItem = new Inventory({
            product_name,
            product_quantity,
            product_expiry,
            cost_per_unit,
            ownerSelect : "WorkspaceM",
            owner : workspace._id,
            item_type : "raw"
        })
        
        await rawItem.save()
        await workspace.save()
        res.status(200).send({rawItem})
    } catch (error) {
        res.status(400).send({error})
    }
} 

const getInventory = async (req, res) => {
    try {
        const workspace = await WorkspaceM.findOne({ email: req.auth.user.email })
        const inventory = await workspace.populate({ path: 'inventory' })
        res.status(200).send({ inventory })
    } catch (error) {
        res.status(400).send({ error })
    }
}

const getStructures = async(req,res) => {
    try {
        const workspace = await WorkspaceM.findOne({ email: req.auth.user.email })
        res.status(200).send({ structures : workspace.structures })
    } catch (error) {
        res.status(400).send({ error })
    }
}

const addStructure = async(req,res) => {
    try {
        const {structure_name, structure_quantity, cost_per_unit} = req.body
        const workspace = await WorkspaceM.findOne({ email: req.auth.user.email })
        const existingStructure = workspace.structures.find((struct)=> struct.structure_name === structure_name)

        if(workspace.vendorPoints<workspace.vendorPoints-(cost_per_unit * structure_quantity)){
            return res.status(200).send({msg : "insufficients funds"})
        }
        workspace.vendorPoints = workspace.vendorPoints - cost_per_unit * structure_quantity
        
        if(!existingStructure){
            workspace.structures.push({structure_name, structure_quantity, cost_per_unit})
            await workspace.save()
            return res.status(200).send({structures : workspace.structures})
        }

        workspace.structures.forEach((struct) => {
            if(struct.structure_name === structure_name){
                struct.structure_quantity = struct.structure_quantity + structure_quantity
            }
        })

        await workspace.save()
        res.status(200).send({structures : workspace.structures})
    } catch (error) {
        res.status(400).send({error})
    }
}


const makeProduct = async(req,res) => {
    try {
        const { product_name, product_quantity, expires_in ,product_details} = req.body;
        const workspace = await WorkspaceM.findOne({ email: req.auth.user.email })
        const product = new Brew({
            product_name,
            product_details,
            expires_in,
            product_quantity,
            owner : workspace._id
        })

        await product.save()
        await workspace.populate('products')
        res.status(200).send({products : workspace.products})
    } catch (error) {
        res.status(400).send({error})
    }
}

const getProducts = async(req,res) => {
    try {
        const workspace = await WorkspaceM.findOne({ email: req.auth.user.email })
        await workspace.populate('products')
        res.status(200).send({products : workspace.products})
    } catch (error) {
        res.status(400).send({error})
    }
}

const getProduct = async (req, res) => {
    try {
        const id = req.params.productId;
        const product = await Brew.findById(id);

        if (product) {
            res.status(200).send({ product });
        }
        else {
            res.status(404).send({ error: " No such order is issued" })
        }
    } catch (error) {
        res.status(400).send({ error })
    }
}

const setRawItem = async(req,res) => {
    try {
        const id = req.params.productId;
        const workspace = await WorkspaceM.findOne({ email: req.auth.user.email })
        const product = await Brew.findById(id);

        if(product.status !== "new"){
            return res.status(200).send({msg : "already started brewing"})
        }
        const {product_name, product_quantity, step} = req.body;
        await workspace.populate('inventory')
        
        const isAvailable  = workspace.inventory.find((item) => {
            return product_name === item.product_name && product_quantity <= item.product_quantity && item.item_type === "raw"
        }) 

        if(!isAvailable){
            return res.status(200).send({msg : "Not such item present"})
        }

        const foundItem = await Inventory.findOne({_id : isAvailable._id})
        foundItem.product_quantity = foundItem.product_quantity - product_quantity
        product.items.push({product_name,product_quantity,cost_per_unit : foundItem.cost_per_unit, step})
        
        await product.save()
        await foundItem.save()
        res.status(200).send({msg : "item successfully entered",foundItem,product})
    } catch (error) {
        res.status(400).send({error})
    }
}

const setStructureItem = async(req,res) => {
    try {
        let flag=0;
        const id = req.params.productId;
        const workspace = await WorkspaceM.findOne({ email: req.auth.user.email })
        const product = await Brew.findById(id);

        if(product.status !== "new"){
            return res.status(200).send({msg : "already started brewing"})
        }
        const {structure_name, structure_quantity, step} = req.body;
        
        workspace.structures.forEach((struct) => {
            if(structure_name === struct.structure_name && structure_quantity <= struct.structure_quantity){
                flag=1;
                struct.structure_quantity = struct.structure_quantity - structure_quantity
            }
        }) 

        if(flag === 0){
            return res.status(200).send({msg : "Not such structure present"})
        }

        product.structures.push({structure_name,structure_quantity, step})
        
        await product.save()
        await workspace.save()
        res.status(200).send({msg : "structure successfully entered",product})
    } catch (error) {
        res.status(400).send({error})
    }
}

const setTimeItem = async (req,res) => {
    try {
        const id = req.params.productId;
        const product = await Brew.findById(id);

        if(product.status !== "new"){
            return res.status(200).send({msg : "already started brewing"})
        }

        const {time, step} = req.body;

        product.time_taken.push({time,step})
        await product.save();
        res.status(200).send({msg : "time stored",product})
    } catch (error) {
        return res.status(400).send({error})        
    }
}

const startBrewingItem = async (req,res) => {
    try {
        const id = req.params.productId;
        const product = await Brew.findById(id);
        const workspace = await WorkspaceM.findOne({ email: req.auth.user.email })

        if(product.items.length <= 1 || product.structures.length === 0){
            return res.status(200).send({msg : "Not sufficient items"})
        }

        if(product.status != "new"){
            return res.status(200).send({msg : "Brewing already happened"})
        }

        else{
            product.status = "pending"
        }

        product.items.sort((a,b) => {
            return b.step - a.step
        })
        product.structures.sort((a,b) =>{
            return b.step - a.step
        })
        product.time_taken.sort((a,b) => {
            return a.step - b.step
        })

        const jobs = product.time_taken.map((item,index) => {
            return agenda.define(`Step ${item.step}`,async() =>{
                while(product.items[product.items.length-1].step === item.step){
                    const pro = product.items.pop()
                    product.cost_per_unit = product.cost_per_unit + pro.cost_per_unit
                    
                }
                while(product.structures[product.structures.length-1].step === item.step){
                    workspace.structures.forEach((struct) => {
                        if(struct.structure_name === product.structures[product.structures.length-1].structure_name){
                            struct.structure_quantity = struct.structure_quantity + product.structures[product.structures.length-1].structure_quantity
                        }
                    })
                    workspace.structures.pop()
                }
                if(index == product.time_taken.length-1){
                    product.status = "completed"
                    product.cost_per_unit = product.cost_per_unit/product.product_quantity
                }
                await product.save()
                await workspace.save()
            })
        })  

        await agenda.start();

        product.time_taken.forEach(async(item) => {
            await agenda.schedule(`${item.time} second`, `Step ${item.step}`);
        })

        res.status(200).send({product, workspace})
    } catch (error) {
        res.status(400).send({error})
    }
}

const moveProduct = async (req, res) => {
    try {
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
            })
            await product.deleteOne();
            await item.save();
            res.status(200).send({ msg: "saved to inventory", workspace })
        }
        else {
            return res.status(200).send({ msg: "Product not ready" })
        }
    } catch (error) {
        return res.status(400).send({ error })
    }
}

const getOrders = async (req, res) => {
    try {
        const workspace = await WorkspaceM.findOne({ email: req.auth.user.email })
        await workspace.populate({ path: 'orders' })
        res.status(200).send({ orders: workspace.orders })
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

const manageOrder = async (req, res) => {
    try {
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
            
            if(!returnedItem){
                return res.status(200).send({ msg: "Item not in inventory please make an product now"})
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
    } catch (error) {
        res.status(400).send({ error })
    }
}


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

