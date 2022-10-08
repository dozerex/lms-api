const mongoose = require('mongoose')

//helper
const getTodayDateOnly = require('../helper/getTodayDateOnly')


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
    }
})

BookStatusSchema.statics.isAvailable = function(accessionNumber) {
    return this.findOne({
        accessionNumber,
        available: true
    })
}

BookStatusSchema.statics.dueBooks = function() {
    const today = getTodayDateOnly()
    return BookStatus.find({
        dueDate: {
            $exists: true,
            $lte: today
        }
    })
}

BookStatusSchema.statics.dueBoooksToday = function() {
    const today = getTodayDateOnly()
    return BookStatus.find({
        $and: [
            {dueDate: {$exists: true} },
            {dueDate: today}
        ]
    })
}

BookStatusSchema.statics.countDueBooksToday = function() {
    const today = getTodayDateOnly()
    return BookStatus.find()
}

BookStatusSchema.statics.countDueBooks = function() {

}

const BookStatus = mongoose.model('BookStatus',BookStatusSchema)

module.exports = BookStatus