const express = require('express')
const cors = require('cors')
const {User} = require('./models')
const {agenda} = require('./db/mongoose-test')

const app = express()


// const delay = async () => {
//     return new Promise((resolve)=>{
//         setTimeout(() => {
//             console.log("delaying");
//             resolve();
//         },10000)
//     })
// }
app.use(express.json())
app.use(cors())

app.get('/',(req,res) => {
    res.status(200).send("app running");    
})

// app.get('/delayit', async (req,res) => {
//     await delay()
//     res.status(200).send("delayed")
// })

app.get('/schedule', async (req,res) => {
    
    let time_taken = [
        {
            time : 1,
            step : 2,
        },
        {
            time : 2,
            step : 3,
        },
        {
            time : 1,
            step : 4,
        },
        {
            time : 10,
            step : 1,
        },
        {
            time : 1,
            step : 5,
        },
    ]


    time_taken.sort((a,b) => {
        return a.step-b.step
    })
    console.log("after sorting : ", time_taken);

    time_taken.forEach((item) => {
        agenda.define(`Step ${item.step}`,async(job) =>{
            console.log(`here ${job.attrs.name}`);
            const something = new User({
                username : "testuser",
                password : "testpassword",
                email : `some@gmail.com${item.step}` ,
                occupation : "Manufacturer"
            })
            await something.save()
        })
    })  

    // const callthis = async () => {
        let sum=0;
        agenda.start();
      
        time_taken.forEach(async (item) => {
            sum = sum + item.time; 
            const date = new Date(Date.now() + sum * 1000)
            console.log(date);
            agenda.schedule(`${sum} second`, `Step ${item.step}`);
        })
    // }

    // callthis()

    res.status(200).send("job started")
})

app.listen(4500, () => {
    console.log("app running");
})