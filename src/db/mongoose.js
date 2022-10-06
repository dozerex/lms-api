const mongoose = require('mongoose')
require('dotenv').config();

const main = async () => {
    const {DB_USERNAME:username, DB_PASSWORD:password, DB_NAME:dbName} = process.env
    await mongoose.connect(`mongodb+srv://${username}:${password}@cluster1.ngexyd3.mongodb.net/?retryWrites=true&w=majority`,{dbName})
}

main()

