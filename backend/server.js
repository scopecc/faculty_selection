require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const connectDB = require('./config/db');  // ✅ Make sure this is correct

// Connect to MongoDB
connectDB();  // ✅ Ensure this function is being called properly

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {  
    res.send("Hello World!");
});

const facultyRoutes = require('./routes/facultyRoutes');
app.use('/faculty', facultyRoutes);
const domainRoutes = require('./routes/domainRoutes');
app.use('/domains', domainRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

