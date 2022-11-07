const mongoose = require('mongoose')
const {ObjectId} = require('mongodb')

const BookStatus = require('./bookStatus')
const Accession = require('./accession')


const accessionGenerator = require('../helper/accessionGenerator')

const BookSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
    },
    date: {
        type: Date,
        required: true
    },
    isbn: {
        type: String,
        required: true,
        minLength: 17,
        maxLenth: 17,
        unique: true,
        index: true
    },
    author: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    copies: {
        type: Number,
        required: true
    },
    available: {
        type: Number,
    },
    books:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "BookStatus"
    }],
    shelf: [{
        type: String,
        required: true
    }]
    // edition: {
    //     type: String,
    //     required: true
    // },
    // placePublished: {
    //     type: String,
    // },
    // publisher: {
    //     type: String,
    //     required: true
    // },
    // copyrightYear: {
    //     type: Number
    // },
    // pages: {
    //     type: Number,
    //     required: true
    // },
    // vol: {
    //     type: Number
    // },
    // source: {
    //     type: String
    // },
    // billNO: {
    //     type: String,
    //     required: true
    // },
    // dateBought: {
    //     type: Date,
    //     required: true
    // },
    // cost: {
    //     type: Number,
    //     required: true
    // },
    
})

BookSchema.pre('save', async function (next) {
    console.log(this)
    const _id = new ObjectId()
    const numberOfBooks = this.copies;
    let accessionNumber;
    try {
        let accessionArray = await Accession.find({})
        accessionNumber = accessionArray[0].accessionNumber
    } catch(e) {
        throw new Error("Unable to retrieve Accession Number from Database")
    }
    for(let i=0;i<numberOfBooks;i++) {
        const aNum = accessionGenerator(accessionNumber)
        accessionNumber = aNum
        const book = new BookStatus({
            accessionNumber: aNum,
            available: true,
            book: _id,
            shelf: this.shelf[i]
        })
        try {
            await book.save()
        } catch(e) {
            throw new Error("Unable to save bookStatus")
        }
        this.books.push(book._id)
    }
    try {
        await Accession.updateOne({},{
            accessionNumber
        })
    } catch(e) {
        throw new Error("Accession Number update failed")
    }
    this._id = _id
    next()
})

const Book = mongoose.model('Book',BookSchema)

module.exports = Book