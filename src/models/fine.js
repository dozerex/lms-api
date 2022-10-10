const mongoose = require('mongoose')

const FineSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 1,
    },
    accessionNumber: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    reason: {
        type: String,
        required: true,
        trim: true,
        minLength: 10,
        maxLength: 100
    },
    to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Beneficiary"
    }
})

module.exports = mongoose.model('Fine',FineSchema)