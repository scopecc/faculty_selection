require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const connectDB = require('./config/db');
// const Registration = require("./models/Registration");

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

// Set registration status for a draft
app.post("/registration-status", async (req, res) => {
    try {
        const { status, draftId } = req.body;
        if (!draftId) return res.status(400).json({ message: "draftId required" });
        if (status !== "OPEN" && status !== "CLOSED") {
            return res.status(400).json({ message: "Invalid status" });
        }
        let reg = await Registration.findOne({ draftId });
        if (!reg) {
            reg = new Registration({ draftId, status });
        } else {
            reg.status = status;
        }
        await reg.save();
        return res.status(200).json({ message: "Status saved successfully" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Error saving status" });
    }
});

// Get registration status for a draft
app.get("/registration-status", async (req, res) => {
    try {
        const { draftId } = req.query;
        if (!draftId) return res.status(400).json({ message: "draftId required" });
        const reg = await Registration.findOne({ draftId });
        return res.status(200).json({ status: reg ? reg.status : "CLOSED" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Error fetching status" });
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


const draftRoutes = require('./routes/draftRoutes');
app.use('/drafts', draftRoutes);

// --- MIGRATION: Ensure all data without draftId is associated with 'Default Draft' ---
const Faculty = require('./models/Faculty');
const Course = require('./models/Course');
const DomainConfig = require('./models/DomainConfig');
const Registration = require('./models/Registration');
const Admin = require('./models/Admin');
const Draft = require('./models/Draft');

async function migrateToDefaultDraft() {
    // Check if any data exists without draftId
    const needsMigration = await Promise.all([
        Faculty.exists({ draftId: { $exists: false } }),
        Course.exists({ draftId: { $exists: false } }),
        DomainConfig.exists({ draftId: { $exists: false } }),
        Registration.exists({ draftId: { $exists: false } }),
        Admin.exists({ draftId: { $exists: false } })
    ]);
    if (needsMigration.some(Boolean)) {
        let defaultDraft = await Draft.findOne({ name: 'Default Draft' });
        if (!defaultDraft) {
            defaultDraft = new Draft({ name: 'Default Draft' });
            await defaultDraft.save();
        }
        await Faculty.updateMany({ draftId: { $exists: false } }, { $set: { draftId: defaultDraft._id } });
        await Course.updateMany({ draftId: { $exists: false } }, { $set: { draftId: defaultDraft._id } });
        await DomainConfig.updateMany({ draftId: { $exists: false } }, { $set: { draftId: defaultDraft._id } });
        await Registration.updateMany({ draftId: { $exists: false } }, { $set: { draftId: defaultDraft._id } });
        await Admin.updateMany({ draftId: { $exists: false } }, { $set: { draftId: defaultDraft._id } });
        console.log('Migrated all data without draftId to Default Draft.');
    }
}

migrateToDefaultDraft();

const adminRoutes = require('./routes/adminRoutes');
app.use('/admin', adminRoutes);

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
