const { User, Profile, WorkspaceM, WorkspaceD, WorkspaceR } = require('../models')
const { asyncErrorHandler } = require('../helpers');

const signup = asyncErrorHandler(async (req, res) => {
    const user = new User(req.body)
    const profile = new Profile({ email: req.body.email, occupation: req.body.occupation })

    let workspace;
    if (req.body.occupation === "Manufacturer") {
        workspace = new WorkspaceM({ email: req.body.email, owner: profile._id })
    }
    else if (req.body.occupation === "Distributor") {
        workspace = new WorkspaceD({ email: req.body.email, owner: profile._id })
    }
    else {
        workspace = new WorkspaceR({ email: req.body.email, owner: profile._id })
    }

    const token = await user.generateToken()

    await user.save();
    await profile.save();
    await workspace.save();
    res.status(201).send({ user, token })
})

const login = asyncErrorHandler(async (req, res) => {
    const user = await User.findByCredentials(req.body.email, req.body.password)

    const token = await user.generateToken()
    res.status(200).send({ user, token })
})

const getUser = asyncErrorHandler(async (req, res) => {
    res.status(200).send({ user: req.auth.user })
})

const logout = asyncErrorHandler(async (req, res) => {
    req.auth.user.tokens = req.auth.user.tokens.filter((token) => {
        return token !== req.auth.token
    })
    await req.auth.user.save()
    res.status(200).json({ msg: "logged out" })
})

const logoutAll = asyncErrorHandler(async (req, res) => {
    req.auth.user.tokens = []
    await req.auth.user.save()
    res.status(200).json({ msg: "logged out everywhere" })
})

module.exports = {
    login,
    signup,
    getUser,
    logout,
    logoutAll
}