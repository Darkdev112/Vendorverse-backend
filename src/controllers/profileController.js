const {User,Profile} =require('../models')
const mongoose = require('mongoose')

const getProfile = async (req,res) => {
    try {
        const user = req.auth.user;
        const detailedUser = await Profile.findOne({email : user.email});
        if(!detailedUser){
            return res.status(200).send({user : null})
        }
        res.status(200).send({user : detailedUser})
    } catch (error) {
        res.status(400).send({error})
    }
}

const getRequests = async (req,res) => {
    try{
       const user = req.auth.user;
       const detailedUser = await Profile.findOne({email : user.email})
       if(!detailedUser || !detailedUser.requests){
         return res.status(200).send({user : null})
       }
       await detailedUser.populate({
            path : 'requests',
            select : 'fullname email occupation work profilePic'
        })
       res.status(200).send({user : detailedUser.requests}) 
    }catch (error){
        res.status(400).send({error});
    }
}

const getConnections = async (req,res) => {
    try{
       const user = req.auth.user;
       const detailedUser = await Profile.findOne({email : user.email})
       if(!detailedUser || !detailedUser.connections){
         return res.status(200).send({user : null})
       }
       await detailedUser.populate({
        path : 'connections',
        select : 'fullname email occupation work profilePic linkedIn twitter location'
    })
       res.status(200).send({user : detailedUser.connections, requests : detailedUser.requests}) 
    }catch (error){
        res.status(400).send({error});
    }
}

// const createProfile = async (req,res) => {
//     try {
//         const user = req.auth.user;
//         const detailedUser = await Profile.findOne({email : user.email});
//         if(!detailedUser){
//             const bodyObj = {...req.body, email : user.email, occupation : user.occupation}
//             const newDetailedUser = await Profile.create(bodyObj)
//             return res.status(201).send({user : newDetailedUser})
//         }
//         res.status(200).send({user : detailedUser})
//     } catch (error) {
//         res.status(400).send({error})
//     }
// }

const updateProfile = async (req,res) => {
    try {
        const user = req.auth.user;
        const updatedObj = {...req.body, email : user.email, occupation : user.occupation}
        const updatedUser = await Profile.findOneAndUpdate({email : user.email},updatedObj,{new : true});
        return res.status(200).send({user : updatedUser})
    } catch (error) {
        return res.status(400).send({error})
    }
}

const addRequest = async (req,res) => {
    try {
        const user = await Profile.findOne({email : req.auth.user.email});
        const receiver = await Profile.findOne({email : req.body.email})
        if(!receiver){
            return res.status(404).send('user does not exist');
        }
        const existingId = receiver.requests.find((id) => id.equals(user._id))
        if(existingId){
            return res.status(400).send('request already exists')
        }
        receiver.requests[receiver.requests.length] = user._id;
        await receiver.populate({path : 'requests'})
        const updatedObject = await receiver.save()
        return res.status(200).send({user : updatedObject})
    } catch (error) {
        return res.status(400).send({error})
    }
}

const manageRequest = async(req,res) => {
    try {
        const user = req.auth.user;
        const requestId = new mongoose.Types.ObjectId(req.body.id)
        
        const userDetails = await Profile.findOne({email : user.email})
        const senderDetails = await Profile.findById(req.body.id)
        if(!senderDetails){
            return res.status(404).send({error : "sender does not exist"})
        }
        if(userDetails.requests.length === 0){
            return res.status(404).send({error : "request does not exist"})
        }

        const existingIdArray = userDetails.requests.filter((id) => !id.equals(requestId))
        if(existingIdArray.length !== (userDetails.requests.length - 1)){
            return res.status(404).send({error : "request does not exist"})
        }
        userDetails.requests= [...existingIdArray];
        if(req.query.success === 'true'){
            userDetails.connections[userDetails.connections.length] = requestId;
            senderDetails.connections[senderDetails.connections.length] = userDetails._id;
        }

        const updatedUser = await userDetails.save();
        await senderDetails.save()
        res.status(200).send({user : updatedUser,success : req.query.success})
        
    } catch (error) {
        res.status(400).send({error})
    }
}


module.exports = {
    getProfile,
    // createProfile,
    updateProfile,
    addRequest,
    manageRequest,
    getRequests,
    getConnections
}