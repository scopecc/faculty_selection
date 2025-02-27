require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const connectDB = require('./config/db');

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

// ✅ Middleware
app.use(express.json());

// ✅ Test Route
app.get("/", (req, res) => {  
    res.send("Hello World!");
});

// ✅ Register Routes
const facultyRoutes = require('./routes/facultyRoutes');
app.use('/faculty', facultyRoutes);

const domainRoutes = require('./routes/domainRoutes');
app.use('/domain-config', domainRoutes);

const otpRoutes = require('./routes/otpRoutes');  
app.use('/otp', otpRoutes); // ✅ Correct API path

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
