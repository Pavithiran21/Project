const express = require("express");
const mongoose = require("mongoose");
const usersRoute = require("./router");
const app = express();

app.use(express.json());


const cors = require('cors');
app.use(cors());

const dotenv=require('dotenv')
dotenv.config()

app.use('/user',usersRoute);

const URL = process.env.URL;

mongoose.connect(URL,
    {useNewUrlParser:true,useUnifiedTopology: true},(err) => {     
     console.log("MongoDB Connected");
    })




const PORT = process.env.PORT || 5003

app.listen(PORT,() => console.log(`Server Running in the port ${PORT}`));