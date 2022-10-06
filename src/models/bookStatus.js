const mongoose = require('mongoose')


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
    lentBy: {
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

const BookStatus = mongoose.model('BookStatus',BookStatusSchema)

module.exports = BookStatus