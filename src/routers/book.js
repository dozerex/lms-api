const express = require('express')


//Models
const Beneficiary = require('../models/beneficiary')
const Book = require('../models/book')
const BookStatus = require('../models/bookStatus')

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
        console.log(e)
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
        const mainBook = await Book.findOne({_id:book.book})
        await Book.updateOne(mainBook,{$set:{
            available:(mainBook.available-1)
        }})
        let booksLent = beneficiary.booksLent
        booksLent.push(book._id)
        await Beneficiary.updateOne({_id:beneficiary._id},{$set:{
            booksLent
        }})
        let today = new Date()
        today = today.toISOString().slice(0,10)
        await BookStatus.updateOne(book,{$set:{
            available: false,
            issueDate: today,
            dueDate: req.body.dueDate,
            issuedTo: beneficiary._id
        }})
        return res.status(201).send("Done")
    } catch(e) {
        console.log(e)
        res.status(400).send("Updation failed")
    }
})

bookRouter.post('/return/', async (req, res) => {
    const {accessionNumber} = req.body
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
        const mainBook = await Book.findOne({_id:book.book})
        await Book.updateOne({_id:mainBook._id},{$set:{
            available:(mainBook.available+1)
        }})
        const beneficiary = await Beneficiary.findOne({_id:beneficiary_id})
        // console.log(beneficiary)
        let booksLent = beneficiary.booksLent.filter(item=>String(book._id)!=String(item))
        // console.log(booksLent)
        await Beneficiary.updateOne({_id:beneficiary._id},{
            $set:{
                booksLent
            }
        })
        return res.send("Done")
    } catch(e) {
        console.log(e)
        return res.status(400).send("Cant update")
    }

})


module.exports = bookRouter

