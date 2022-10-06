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

// bookRouter.use('/issue-book/', async (req,res,next) => {
//     const {accessionNumber} = req.body
//     try {
//         const book = await BookStatus.findOne({
//             accessionNumber,
//             available: true
//         })
//         req.isAvaialable = false
//         if(book) {
//             req.isAvaialable = true
//         }
//         next()
//     } catch(e) {
//         res.status(400).send("Invalid Accession Number")
//     }
// })

// bookRouter.use('/issue-book/', async (req,res,next) => {
//     const {enrollmentNumber} = req.body
//     try {
//         const beneficiary = await Beneficiary.findOne({enrollmentNumber})
//         const noOfBooksLent = beneficiary.booksLent.length
//         req.canCheckOut = true
//         if(noOfBooksLent>=5) {
//             req.canCheckOut = false
//         }
//         next()
//     } catch(e) {
//         res.status(400).send("Invalid Enrollment Number")
//     }
// })

bookRouter.post('/issue-book/', async (req,res) => {
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
        return res.status(400).send("Cant lend book")
    }
    try {
        const mainBook = await Book.findOne({_id:book.book})
        await Book.updateOne(mainBook,{$set:{
            available:(mainBook.available-1)
        }})
        beneficiary.booksLent.push(book._id)
        await Beneficiary.updateOne({_id:beneficiary._id},{$set:{
            booksLent:booksLent
        }})
        await BookStatus.updateOne(book,{$set:{
            available: false,
            issueDate: Date(Date.now()),
            dueDate: req.body.dueDate
        }})
        return res.status(201).send("Done")
    } catch(e) {
        res.status(400).send("Updation failed")
    }
})


module.exports = bookRouter

