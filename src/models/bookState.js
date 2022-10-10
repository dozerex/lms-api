const mongoose = require('mongoose')

const BookStateSchema = new mongoose.Schema({
    message: [{
        type: String,
        lowercase: true,
        trim: true,
        minLength: 10,
        maxLength: 100
    }]
})


module.exports = mongoose.model('BookState',BookStateSchema)