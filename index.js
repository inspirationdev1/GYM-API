const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const cors = require('cors');

require('dotenv').config();

const PORT = process.env.PORT||4000;

// app.use(cors({
//     origin: 'http://localhost:5173', //Your React app's URL
//     credentials: true
// })) 
app.use(cors({
    origin: `${process.env.VITE_FRONTEND_URL}`, //Your React app's URL
    credentials: true
})) 

// middleware 
// const corsOptions = {exposedHeaders:"Authorization"}
// app.use(cors(corsOptions));

app.use(cookieParser());
app.use(express.json());
require('./DBConn/conn');

const GymRoutes = require('./Routes/gym');
const MembershipRoutes = require('./Routes/membership');
const MemberRoutes = require('./Routes/member');


app.use('/auth',GymRoutes);
app.use('/plans',MembershipRoutes);
app.use('/members',MemberRoutes);

app.listen(PORT, ()=>{
    console.log(`Server is running on PORT ${PORT}`);
})



