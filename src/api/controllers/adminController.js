const {Inventory} = require('../models')
const { asyncErrorHandler } = require('../helpers')
const { loadAgenda } = require('../../db/agenda')

const cleanInventory = asyncErrorHandler(async(req,res) => {
    await Inventory.deleteMany({product_quantity : 0})
    const inventory = await Inventory.find()
    res.status(200).send({inventory})
})

const cleanJobs = asyncErrorHandler(async (req,res) => {
    const agenda = await loadAgenda()

    await agenda.start()
    const jobs = await agenda.jobs()

    if(jobs.length === 0){
        return res.status(200).send({msg : "No jobs present"})
    }

    jobs.forEach(async (job) => {
        if(job.attrs?.lastFinishedAt){
            await job.remove()
        }
    })
    res.status(200).send("Completed jobs removed")
})

const resumeJob = asyncErrorHandler(async(req,res) => {
    const agenda = await loadAgenda()
    
    await agenda.start()
    const jobs = await agenda.jobs()

    if(jobs.length === 0){
        return res.status(200).send({msg : "No jobs present"})
    }

    jobs.forEach(async(job) => {
            console.log(job);
            await job.enable()
    })
    const newjobs = await agenda.jobs()
    
    res.status(200).send({newjobs})
})

module.exports = {cleanInventory, cleanJobs, resumeJob}