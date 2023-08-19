const {User, Session, Profile, WorkspaceM, WorkspaceD, WorkspaceR} = require('../models')

const signup = async(req,res) => {
    try {
        const user = new User(req.body)
        const profile = new Profile({email : req.body.email, occupation : req.body.occupation})
        let workspace;
        if(req.body.occupation === "Manufacturer"){
            workspace = new WorkspaceM({email : req.body.email, owner : profile._id})
        }
        else if(req.body.occupation === "Distributor"){
            workspace = new WorkspaceD({email : req.body.email, owner : profile._id})
        }
        else{
            workspace = new WorkspaceR({email : req.body.email, owner : profile._id})
        }
        const  {sessionToken, expiresAt} = await user.generateCookie()
        await user.save();
        await profile.save();
        await workspace.save();
        res.cookie('session_token', sessionToken, {maxAge : expiresAt})
        res.status(201).send({user, sessionToken})
    } catch (error) {
        return res.status(400).send({error})
    }
}

const login = async (req,res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const  {sessionToken, expiresAt} = await user.generateCookie()
        res.cookie('session_token', sessionToken, {maxAge : expiresAt})
        res.status(200).send({user, sessionToken})
    } catch (error) {
        return res.status(400).send({error})
    }
}

const getUser = async(req,res) => {
    try {
        return res.status(200).send({user : req.auth.user})
    } catch (error) {
        return res.status(404).send({error})
    }
}

const logout = async(req,res) => {
    try {
        const deletedToken = await Session.findOneAndDelete({sessionToken : req.auth.sessionToken})
        res.clearCookie('session_token')
        res.status(200).send("logged out")
    } catch (error) {
        return res.status(400).send({error})
    }
}

module.exports = {
    login, 
    signup,
    getUser,
    logout
}