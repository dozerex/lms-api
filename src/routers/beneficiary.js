const express = require('express')

//Model
const Beneficiary = require('../models/beneficiary')

const beneficiaryRouter = express.Router({
    strict: true
})


beneficiaryRouter.post('/insert/',(req,res)=> {
    const detail = req.body;
    if(detail.role.toLowerCase()=='student' && !detail.program && !detail.year) {
        return res.status(400).send("Please enter program and year details if it is student");
    }
    const beneficiary = new Beneficiary(req.body)
    beneficiary.save().then(()=>{
        res.send(beneficiary)
    }).catch((e)=>{
        res.status(400).send(e)
    })
})

// beneficiaryRouter.get('/no-of-books-lent/',)

module.exports = beneficiaryRouter