const express = require('express');

//Model
const Beneficiary = require('../models/beneficiary');
const BookStatus = require('../models/bookStatus');

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


beneficiaryRouter.get('/list/',async (req,res) => {
    try {
        const beneficiaries = await Beneficiary.find({});
        const numberOfStudents = await Beneficiary.countDocuments({
            role: "student"
        })
        const numberofFaculty = await Beneficiary.countDocuments({
            role: "faculty"
        })
        res.status(200).send({beneficiaries,numberOfStudents,numberofFaculty})
    } catch(e) {
        res.status(400).send("Unable to retrieve data");
    }
})


beneficiaryRouter.post('/books-lent/', async (req, res) => {
    try {
        const beneficiary = await Beneficiary.findOne(req.body);
        const booksLent = beneficiary.booksLent;
        const books = await BookStatus.find({
            _id : {$in: booksLent}
        })
        res.send(books)
    } catch(e) {
        console.log("error")
        return res.status(400).send("No Beneficiary")
    }
})


module.exports = beneficiaryRouter