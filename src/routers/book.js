const express = require('express')


//Models
const Beneficiary = require('../models/beneficiary')
const Book = require('../models/book')
const BookStatus = require('../models/bookStatus')
const BookState = require('../models/bookState')
const Fine = require('../models/fine')
const Transaction = require('../models/transaction')


//helper
const getTodayDateOnly = require('../helper/getTodayDateOnly')

const bookRouter = express.Router({
    strict: true
})


bookRouter.post('/insert/', async (req, res)=>{
    const book = new Book({
        ... req.body,
        date: Date(Date.now()),
        available: req.body.copies,
    })
    const transaction = new Transaction({
        date: Date(Date.now()),
        operation: "insert book",
        isbn: req.body.isbn,
        title: req.body.title
    })
    try {
        await book.save();
        await transaction.save()
        res.status(201).send(book)
    } catch(e) {
        console.log(e)
        res.status(400).send("Unable to insert new book")
    }
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
    } catch(e) {
        console.log(e)
        res.status(400).send("Updation failed")
    }
    const transaction = new Transaction({
        date: Date(Date.now()),
        operation: "book issued",
        accessionNumber,
        issueDate: getTodayDateOnly(),
        dueDate: req.body.dueDate,
        enrollmentNumber,
    })
    try {
        await transaction.save()
        return res.status(200).send("Done")
    } catch(e) {
        res.status(200).send("Done, but transaction not added")
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
    const transactionRenew = new Transaction({
        date: today,
        operation: "renew book",
        accessionNumber,
        issueDate: today,
        dueDate
    })
    try {
        const book = await BookStatus.updateOne({accessionNumber},{
            $set: {
                issueDate: today,
                dueDate
            }
        })
        await transactionRenew.save()
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
            const transactionFine = new Transaction({
                date: today,
                operation: "fine book",
                accessionNumber,
                fineAmount: fine.amount,
                reason: fine.reason
            })
            await newFine.save()
            await transactionFine.save()
        }
        res.send(book)
    } catch(e) {
        console.log(e)
        res.status(400).send("Can't renew this book")
    }
})


bookRouter.post('/return/', async (req, res) => {
    const {accessionNumber,status,fine} = req.body
    
    try {
        const book = await BookStatus.findOne({accessionNumber})
        if(book.available) throw new Error("Book is already available")
        const beneficiary_id = book.issuedTo
        const {enrollmentNumber} = await Beneficiary.findOne({_id:beneficiary_id}).select('enrollmentNumber')
        const transaction = new Transaction({
            date: Date(Date.now()),
            operation: "book returned",
            accessionNumber,
            returnDate: getTodayDateOnly(),
            enrollmentNumber
        })
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
        await transaction.save()
        if(fine) {
            const newFine = new Fine({
                date: Date(Date.now()),
                amount: fine.amount,
                reason: fine.reason,
                accessionNumber,
                to: beneficiary_id
            })
            const transactionFine = new Transaction({
                date: Date(Date.now()),
                operation: "fine book",
                accessionNumber,
                fineAmount: fine.amount,
                reason: fine.reason,
                enrollmentNumber
            })
            await newFine.save()
            await transactionFine.save()
        }
        return res.send("Done")
    } catch(e) {
        console.log(e)
        return res.status(400).send("Cant update")
    }

})


bookRouter.get('/dashboard-stats/', async (req, res) => {
    const today = getTodayDateOnly()
    let count = {}
    try {
        count.dueToday = await BookStatus.countDocuments({
            dueDate: today
        })
        // count.dueBooks = await BookStatus.countDocuments({
        //     dueDate: {
        //         $lte: today
        //     }
        // })
        count.issuedToday = await BookStatus.countDocuments({
            issueDate: today
        })
        return res.send(count)
    } catch(e) {
        console.log(e)
        res.status(400).send("Unable to fetch data")
    }
})


bookRouter.get('/todaydue-list/', async (req, res) => {
    const today = getTodayDateOnly()
    try {
        const books = await BookStatus.dueBooksToday()
        if(!books) {
            return res.send("No Due books")
        }
        return res.send(books)
    } catch(e) {
        res.status(400).send("Unable to process your request, please try again")
    }
})


bookRouter.get('/overdue-list/', async (req, res) => {
    const today = getTodayDateOnly()
    try {
        const overdueBooks = await BookStatus.overdueBooks()
        if(!overdueBooks) {
            res.send("No overdue books")
        }
        return res.send(overdueBooks)
    } catch(e) {
        res.status(400).send("Unable fetch request")
    }
})

bookRouter.get('/issued/', async (req, res) => {
    try {
        const booksList = await BookStatus.find({available: false}).populate("book").populate("issuedTo")
        return res.send(booksList)
    } catch(e) {
        res.status(400).send('Unable fetch request')
    }
})

bookRouter.get('/list/', async (req, res) => {
    try {
        const books = await Book.find({},{
            title:1,
            author: 1,
            edition: -1,
            available: -1,
            publisher: 1,
            copies: 1,
            isbn: 1
        });
        res.send(books)
    } catch(e) {
        console.log(e);
        res.status(400).send("Unable to fetch books")
    }

})

bookRouter.get('/:id/', async (req, res) => {
    const isbn = req.params.id;
    try {
        const mainBook = await Book.findOne({isbn})
        const books = await BookStatus.find({book: mainBook._id}).populate("issuedTo")
        res.send(books)
    } catch(e) {
        res.status(400).send("No Book")
    }
})


module.exports = bookRouter

