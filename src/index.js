const express = require('express')


//Connecting to db
require('./db/mongoose')

//Routers
const bookRouter = require('./routers/book')
const userRouter = require('./routers/user')
const beneficiaryRouter = require('./routers/beneficiary')


const app = express()
const port = process.env.PORT || 3000

app.use(express.json())

app.use('/books',bookRouter)
app.use('/users',userRouter)
app.use('/beneficiary',beneficiaryRouter)


app.listen(port, ()=> {
    console.log("Server is up on port "+port)
})

