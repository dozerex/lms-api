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

beneficiaryRouter.post('/delete/', async (req, res) => {
    console.log(req.body)
    try {
        const recordDelete = req.body;
        const lent = await Beneficiary.find({enrollmentNumber:{$in:recordDelete}}, {booksLent: 1})
        console.log(lent)
        for(let i=0;i<lent.length;i++) {
            if(lent[i].booksLent.length>0) {
                throw new Error("Beneficiay have due books")
            }
        }
        await Beneficiary.deleteMany({enrollmentNumber: {$in: recordDelete}})
        res.send("Done")
    } catch(e) {
        console.log(e)
        res.status(400).send("Beneficiary have due books");
    }
})


beneficiaryRouter.get('/list/',async (req,res) => {
    try {
        const beneficiaries = await Beneficiary.find({},{
            enrollmentNumber: 1,
            name: 1,
            email: 1,
            mobile: 1,
            year: 1,
            program: 1
        });
        const numberOfStudents = await Beneficiary.countDocuments({
            role: "student"
        })
        const numberofFaculty = await Beneficiary.countDocuments({
            role: "faculty"
        })
        res.status(200).send(beneficiaries)
    } catch(e) {
        res.status(400).send("Unable to retrieve data");
        console.log(e);
    }
})


beneficiaryRouter.get('/:id/', async (req, res) => {
    const enrollmentNumber = req.params.id;
    try {
        const beneficiary = await Beneficiary.findOne({
            enrollmentNumber
        })
        const booksLent = beneficiary.booksLent;
        const books = await BookStatus.find({
            _id : {$in: booksLent}
        }).populate("book")
        res.send(books)
    } catch(e) {
        console.log("error")
        return res.status(400).send("No Beneficiary")
    }
})

// beneficiaryRouter.post('/books-lent/', async (req, res) => {
//     try {
//         const beneficiary = await Beneficiary.findOne(req.body);
//         const booksLent = beneficiary.booksLent;
//         const books = await BookStatus.find({
//             _id : {$in: booksLent}
//         })
//         res.send(books)
//     } catch(e) {
//         console.log("error")
//         return res.status(400).send("No Beneficiary")
//     }
// })


module.exports = beneficiaryRouter