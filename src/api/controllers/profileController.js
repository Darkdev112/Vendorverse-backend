const mongoose = require('mongoose')
const { Profile, WorkspaceD, WorkspaceM, WorkspaceR } = require('../models')
const { asyncErrorHandler, CustomError } = require('../helpers')

const getProfile = asyncErrorHandler(async (req, res) => {
    const user = req.auth.user;
    const detailedUser = await Profile.findOne({ email: user.email });

    if (!detailedUser) {
        return res.status(200).send({ user: null })
    }

    res.status(200).send({ user: detailedUser })
})

const getRequests = asyncErrorHandler(async (req, res) => {
    const user = req.auth.user;
    const detailedUser = await Profile.findOne({ email: user.email })

    if (!detailedUser || !detailedUser.requests) {
        return res.status(200).send({ user: [] })
    }

    await detailedUser.populate({
        path: 'requests',
        select: 'fullname email occupation work profilePic'
    })
    res.status(200).send({ user: detailedUser.requests })
})

const getConnections = asyncErrorHandler(async (req, res) => {
    const user = req.auth.user;
    const detailedUser = await Profile.findOne({ email: user.email })

    if (!detailedUser || !detailedUser.connections) {
        return res.status(200).send({ user: [] })
    }

    await detailedUser.populate({
        path: 'connections',
        select: 'fullname email occupation work profilePic linkedIn twitter location'
    })
    res.status(200).send({ user: detailedUser.connections, requests: detailedUser.requests })
})

const updateProfile = asyncErrorHandler(async (req, res) => {
    const user = req.auth.user;
    const updatedObj = { ...req.body, email: user.email, occupation: user.occupation }

    const updatedUser = await Profile.findOneAndUpdate({ email: user.email }, updatedObj, { new: true });

    res.status(200).send({ user: updatedUser })
})

const addRequest = asyncErrorHandler(async (req, res) => {
    const user = await Profile.findOne({ email: req.auth.user.email });
    const receiver = await Profile.findOne({ email: req.body.email })

    if (!receiver) {
        return res.status(200).send({ error: 'Not on Vendorverse' });
    }

    const existingId = receiver.requests.find((id) => id.equals(user._id))
    const existingConnection = receiver.connections.find((id) => id.equals(user._id))
    const existingRequest = user.requests.find((id) => id.equals(receiver._id))

    if (existingId || existingConnection || existingRequest) {
        return res.status(200).send({ error: 'request send already' })
    }

    receiver.requests[receiver.requests.length] = user._id;
    await receiver.populate({ path: 'requests' })

    const updatedObject = await receiver.save()
    return res.status(200).send({ user: updatedObject })
})

const manageRequest = asyncErrorHandler(async (req, res) => {
    const user = req.auth.user;
    const requestId = new mongoose.Types.ObjectId(req.body.id)

    const userDetails = await Profile.findOne({ email: user.email })
    const senderDetails = await Profile.findById(req.body.id)

    if (!senderDetails) {
        return res.status(404).send({ error: "sender does not exist" })
    }
    if (userDetails.requests.length === 0) {
        return res.status(404).send({ error: "request does not exist" })
    }

    const existingIdArray = userDetails.requests.filter((id) => !id.equals(requestId))
    if (existingIdArray.length !== (userDetails.requests.length - 1)) {
        return res.status(404).send({ error: "request does not exist" })
    }

    userDetails.requests = [...existingIdArray];
    if (req.query.success === 'true') {
        userDetails.connections[userDetails.connections.length] = requestId;
        senderDetails.connections[senderDetails.connections.length] = userDetails._id;
    }

    const updatedUser = await userDetails.save();
    await senderDetails.save()
    res.status(200).send({ user: updatedUser, success: req.query.success })
})

const addVendorPoints = asyncErrorHandler (async (req,res) => {
    const {occupation, email} = req.auth.user
    let workspace

    switch(occupation){
        case "Manufacturer":
            workspace = await WorkspaceM.findOne({email})
            break;
        
        case "Distributor":
            workspace = await WorkspaceD.findOne({email})
            break;

        case "Retailer":
            workspace = await WorkspaceR.findOne({email})
            break;

        default:
            throw new CustomError('User not found', 404)
    }

    workspace.vendorPoints += req.body.points
    await workspace.save()
    res.status(200).send({workspace})
})

const getVendorPoints = asyncErrorHandler (async (req,res) => {
    const {occupation, email} = req.auth.user
    let workspace

    switch(occupation){
        case "Manufacturer":
            workspace = await WorkspaceM.findOne({email})
            break;
        
        case "Distributor":
            workspace = await WorkspaceD.findOne({email})
            break;

        case "Retailer":
            workspace = await WorkspaceR.findOne({email})
            break;

        default:
            throw new CustomError('User not found', 404)
    }

    res.status(200).send({points : workspace.vendorPoints})
})


module.exports = {
    getProfile,
    updateProfile,
    addRequest,
    manageRequest,
    getRequests,
    getConnections,
    addVendorPoints,
    getVendorPoints
}