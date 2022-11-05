const mongoose = require('mongoose')

const TransactionSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
    },
    operation: {
        type: String, 
        required: true,
        lowercase: true
    },
    accessionNumber: {
        type: String
    },
    isbn: {
        type: String
    },
    issueDate: {
        type: Date
    },
    dueDate: {
        type: Date
    },
    returnDate: {
        type: Date
    },
    fineAmount: {
        type: Number
    },
    reason: {
        type: String
    },
    enrollmentNumber: {
        type: String
    }
})

module.exports = mongoose.model("Transaction",TransactionSchema)