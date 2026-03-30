// mongodb://localhost:27017
require("dotenv").config();

const mongoose = require('mongoose');

// mongoose.connect('mongodb://localhost:27017/gymBackend')
// .then(()=> console.log('DB connection successfull')).catch(err=>{
//     console.log(err);
// });

mongoose.connect(process.env.MONGO_URL).then(db=>{
    console.log("MongoDb is Connected Successfully.")
}).catch(e=>{
    console.log("MongoDb Error",e)
})