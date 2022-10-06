const mongoose = require('mongoose')

const AccessionSchema = new mongoose.Schema({
    accessionNumber: {
        type: String
    }
})

module.exports = mongoose.model('Accession',AccessionSchema)