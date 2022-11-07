const mongoose = require('mongoose')
const {ObjectId} = require('mongodb')

//helper
const getTodayDateOnly = require('../helper/getTodayDateOnly')

//model
const BookState = require('../models/bookState')


const BookStatusSchema = new mongoose.Schema({
    // isbn:{
    //     type: String,
    //     required: true,
    //     trim: true,
    // },
    accessionNumber:{
        type: String,
        required: true,
        // trim: true,
        // uppercase: true,
        unique: true,
        index: true
    },
    available:{
        type: Boolean,
        required: true
    },
    issueDate: {
        type: Date,
    },
    dueDate:{
        type: Date,
    },
    book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Book",
        required: true
    },
    issuedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"Beneficiary"
    },
    status: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"BookState"
    },
    shelf: {
        type: String,
        required: true
    }
})

BookStatusSchema.pre('save', async function (next) {
    const bookState = new BookState({})
    try {
        await bookState.save()
        this.status = bookState._id
        next()
    } catch(e) {
        throw new Error("Error")
    }
})

BookStatusSchema.statics.isAvailable = function(accessionNumber) {
    return this.findOne({
        accessionNumber,
        available: true
    })
}

BookStatusSchema.statics.overdueBooks = function() {
    const today = getTodayDateOnly()
    return this.find({
        dueDate: {
            $exists: true,
            $lt: today
        }
    })
}

BookStatusSchema.statics.dueBooksToday = function() {
    const today = getTodayDateOnly()
    return this.find({
        $and: [
            {dueDate: {$exists: true} },
            {dueDate: today}
        ]
    })
}

const BookStatus = mongoose.model('BookStatus',BookStatusSchema)

module.exports = BookStatus