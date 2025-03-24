require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const connectDB = require('./config/db');
const Registration = require("./models/Registration");

// ✅ Initialize app first
const app = express();

// ✅ Connect to MongoDB
connectDB();

// ✅ Allow CORS
// app.use(cors({
//   origin: "https://faculty-selection.vercel.app",
//   methods: "GET,POST,PUT,DELETE",
//   allowedHeaders: "Content-Type,Authorization",
//   credentials: true
// }));

app.use(cors())

// ✅ Middleware
app.use(express.json());

// ✅ Test Route
app.get("/", (req, res) => {  
    res.send("Hello World!");
});

app.post("/registration-status",async (req, res) => {
    try{
        const {status} = req.body;
        if(status!="OPEN" && status!="CLOSED"){
            return res.status(400).json({message:"Invalid status"}); 
        }
        const statusInDb = await Registration.find();
        statusInDb[0].status=status;
        await statusInDb[0].save();
        return res.status(200).json({message:"Status saved successfully"});
    }catch(err){
        console.log(err)
    }
});

app.get("/registration-status",async (req, res) => {
    try{
        const status = await Registration.find();
        return res.status(200).json({status:status[0].status});
    }catch(err){
        console.log(err)
    }
});

// ✅ Register Routes
const facultyRoutes = require('./routes/facultyRoutes');
app.use('/faculty', facultyRoutes);

const domainRoutes = require('./routes/domainRoutes');
app.use('/domain-config', domainRoutes);

const otpRoutes = require('./routes/otpRoutes');  
app.use('/otp', otpRoutes); // ✅ Correct API path

const courseRoutes = require('./routes/courseRoutes');  // ✅ Add courseRoutes
app.use('/courses', courseRoutes);

const adminRoutes = require('./routes/adminRoutes');
app.use('/admin', adminRoutes);

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
