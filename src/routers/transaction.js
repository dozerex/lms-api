const express = require('express')

//Models
const Transaction = require('../models/transaction')

//Helper
const getTodayDateOnly = require('../helper/getTodayDateOnly')


const transactionRouter = express.Router({
    strict: true
})

transactionRouter.post('/list/', async (req, res) => {
    try {
        const fromDate = req.body.fromDate;
        const toDate = req.body.toDate;
        const transactions = await Transaction.find({
            date: {
                $gte: fromDate,
                $lte: toDate
            }
        }).sort({date: -1})
        res.send(transactions) 
    } catch(e) {
        res.status(400).send(e)
    }

})


transactionRouter.get('/book-stats/', async (req, res) => {
    const today = getTodayDateOnly();
    try {
        const recentTransaction = await Transaction.find({
            operation: {
                $ne: "insert book"
            }
        }).sort({date: -1}).limit(6).select(["accessionNumber","enrollmentNumber","date","operation"])
        const recentBookAddition = await Transaction.find({
            operation: "insert book"
        }).sort({date: -1}).limit(5).select(["title","date"])
        res.send({recentBookAddition,recentTransaction})
    } catch(e) {
        res.status(400).send(e)
    }
})

transactionRouter.get('/dashboard-stats/', async (req, res) => {
    const today = getTodayDateOnly();
    let count = {}
    try {
        count.returnedToday = await Transaction.countDocuments({
            date: {
                $gte:today
            },
            operation: "return book"
        })
        const fine = await Transaction.find({
            date: {
                $gte: today 
            },
            operation: "fine book"
        }).select("fineAmount")
        console.log(fine)
        let sum = 0;
        fine.forEach(function (value) {
            sum+=value.fineAmount;
        })
        count.fineCollectedToday = sum
        res.send(count)
    } catch(e) {
        console.log(e)
        res.status(400).send(e)
    }
})


module.exports = transactionRouter