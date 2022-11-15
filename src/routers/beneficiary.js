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

beneficiaryRouter.get('/getBeneficiary', async (req, res) => {
    if (req.query.email && req.query.password) {
        try {
          const user = await Beneficiary.findOne({
            email: req.query.email,
            password: req.query.password,
          });
          if (user) {
            res.status(200).json({
              message: "User already exists",
              data: user,
            });
          } else
            res.status(203).json({
              message: "User does not exist",
              data: null,
            });
        } catch (e) {
          res.status(500).json({
            message: "Internal server error",
            data: e,
          });
        }
      } else {
        res.status(500).json({
          message: "Invalid data",
          data: e,
        });
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