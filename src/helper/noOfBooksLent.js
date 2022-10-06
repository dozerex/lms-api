const noOfBoooksLent = async (req,res) => {
    try {
        const beneficiary = await Beneficiary.findOne({
            enrollmentNumber:req.body.enrollmentNumber,
        })
        const noOfBooksLent = beneficiary.booksLent.length
        res.status(200).send(noOfBooksLent)
    } catch(e) {
        res.status(400).send("Invalid Input")
    }
}

module.exports = noOfBooksLent