const express = require('express')


//Models
const Beneficiary = require('../models/beneficiary')
const Book = require('../models/book')
const BookStatus = require('../models/bookStatus')
const BookState = require('../models/bookState')
const Fine = require('../models/fine')


//helper
const getTodayDateOnly = require('../helper/getTodayDateOnly')

const bookRouter = express.Router({
    strict: true
})


bookRouter.post('/insert/',(req, res)=>{
    const book = new Book({
        ... req.body,
        date: Date(Date.now()),
        available: req.body.copies,
    })
    book.save().then((book)=>{
        res.status(201).send(book)
    }).catch((e)=>{
        res.status(400).send(e)
    })
})

bookRouter.get('/search/',async (req,res) => {
    const {accessionNumber,...query} = req.body.accessionNumber
    if(!accessionNumber) {
        try {
            const books = await Book.find(query).populate('books')
            if(!books) {
                res.status(200).send("No books found!")
            }
            else {
                // console.log(books[0]._id)
                res.status(200).send(books);
            }
        }
        catch(e) {
            res.status(400).send("Failed to retrieve data")
        }
    }
    else {

    }
})

bookRouter.get('/book-available/',async (req,res)=>{
    try {
        const books = await Book.find({
            ... req.body,
            available:{$gt:0}
        }).select("title author available")
        res.status(200).send(books)
    } catch(e) {
        res.status(400).send(e)
    }
})

bookRouter.get('/due/', async (req, res) => {
    const today = new Date()
    try {
        const books = await BookStatus.dueBooks()
        if(!books) {
            return res.send("No Due books")
        }
        return res.send(books)
    } catch(e) {
        res.status(400).send("Unable to process your request, please try again")
    }
})


bookRouter.post('/issue/', async (req,res) => {
    const {accessionNumber,enrollmentNumber} = req.body
    let book,beneficiary
    try {  
        book = await BookStatus.isAvailable(accessionNumber)
        if(!book) {
            throw new Error()
        }
    } catch(e) {
        return res.status(400).send("Book not available")
    }
    try {
        beneficiary = await Beneficiary.findOne({enrollmentNumber})
        if(beneficiary.booksLent.length>=5) {
            throw new Error()
        }
    } catch(e) {
        console.log(e)
        return res.status(400).send(e)
    }
    try {
        await Book.updateOne({_id:book.book},{
            $inc:{
                available:-1
            }
        })
        await Beneficiary.updateOne({_id:beneficiary._id},{
            $push:{
                booksLent:book._id
            }
        })
        const today = getTodayDateOnly()
        await BookStatus.updateOne({_id:book._id},{
            $set:{
                available: false,
                issueDate: today,
                dueDate: req.body.dueDate,
                issuedTo: beneficiary._id
            }
        })
        return res.status(201).send("Done")
    } catch(e) {
        console.log(e)
        res.status(400).send("Updation failed")
    }
})

bookRouter.post('/status/', async (req, res) => {
    const {accessionNumber} = req.body
    try {
        const bookDetail = await BookStatus.findOne({accessionNumber}).populate('issuedTo').populate('book')
        res.send(bookDetail)
    } catch(e) {
        res.status(400).send("Wrong")
    }
})

bookRouter.post('/renew/', async (req, res) => {
    const {accessionNumber, dueDate, fine} = req.body
    const today = getTodayDateOnly()
    try {
        const book = await BookStatus.updateOne({accessionNumber},{
            $set: {
                issueDate: today,
                dueDate
            }
        })
        if(fine) {
            const book = await BookStatus.findOne({accessionNumber})
            const today = getTodayDateOnly()
            const newFine = new Fine({
                date: today,
                amount: fine.amount,
                reason: fine.reason,
                accessionNumber,
                to: book.issuedTo
            })
            await newFine.save()
        }
        res.send(book)
    } catch(e) {
        res.status(400).send("Can't renew this book")
    }
})


bookRouter.post('/return/', async (req, res) => {
    const {accessionNumber,status,fine} = req.body
    try {
        const book = await BookStatus.findOne({accessionNumber})
        if(book.available) throw new Error("Book is already available")
        const beneficiary_id = book.issuedTo
        await BookStatus.updateOne({_id:book._id},{
            $set:{
                available: true
            },
            $unset:{
                issueDate:"",
                dueDate:"",
                issuedTo:""
            }
        })
        await Book.updateOne({_id:book.book},{
            $inc:{
                available:1
            }
        })
        await Beneficiary.updateOne({_id:beneficiary_id},{
            $pull:{
                booksLent:book._id
            }
        })
        if(status) {
            const result = await BookState.updateOne({_id:book.status},{
                $push: {
                    message: status
                }
            })
            console.log(result)
        }
        if(fine) {
            const today = getTodayDateOnly()
            const newFine = new Fine({
                date: today,
                amount: fine.amount,
                reason: fine.reason,
                accessionNumber,
                to: beneficiary_id
            })
            await newFine.save()
        }
        return res.send("Done")
    } catch(e) {
        console.log(e)
        return res.status(400).send("Cant update")
    }

})


bookRouter.get('/stats/', async (req, res) => {
    const today = getTodayDateOnly()
    let count = {}
    try {
        count.todayDueBooks = await BookStatus.countDocuments({
            dueDate: today
        })
        count.dueBooks = await BookStatus.countDocuments({
            dueDate: {
                $lte: today
            }
        })
        count.issuedToday = await BookStatus.countDocuments({
            issueDate: today
        })
        return res.send(count)
    } catch(e) {
        console.log(e)
        res.status(400).send("Unable to fetch data")
    }
})


module.exports = bookRouter

