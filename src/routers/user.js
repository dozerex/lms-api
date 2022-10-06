const express = require('express')

const userRouter = express.Router({
    strict: true
})

userRouter.post('/insert/',(req,res)=> {
    const user = new User(req.body);
    user.save().then(()=>{
        res.status(201).send(user)
    }).catch((e)=>{
        res.status(400)
        res.send(e)
    })
})

module.exports = userRouter