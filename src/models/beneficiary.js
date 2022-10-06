const mongoose = require('mongoose')
const validator = require('validator')

const BeneficiarySchema = new mongoose.Schema({
    enrollmentNumber: {
        type: String,
        required: true,
        trim: true,
        index: true,
        unique: true,
        uppercase: true
    },
    name:{
        type: String,
        required: true,
        trim: true,
    },
    role: {
        type: String, 
        required: true,
        lowercase: true,
        trim: true
    },
    email: {
        type: String, 
        required: true,
        lowercase: true,
        trim: true,
        unique: true,
        validate(value) {
            const address = value.toLowerCase().trim()
            const pattern = /.+@iiitl.ac.in/
            if(!validator.isEmail(address)) {
                throw new Error("Invalid Email address")
            }
            if(!pattern.test(address)) {
                throw new Error("Enter institute email address")
            }
        }
        
    },
    program: {
        type: String,
    },
    year: {
        type: Date,
    },
    booksLent: [{
        type:mongoose.Schema.Types.ObjectId,
        ref:"BookStatus"
    }]
})


const Beneficiary = mongoose.model('Beneficiary',BeneficiarySchema)


module.exports = Beneficiary