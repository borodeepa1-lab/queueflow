require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { ensureDatabase } = require("./utils/ensureDatabase");

const tokenRoutes = require("./routes/tokenRoutes");
const queueRoutes = require("./routes/queueRoutes");
const eventRoutes = require("./routes/eventRoutes"); 
const staffRoutes = require("./routes/staffRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const registrationRoutes = require("./routes/registrationRoutes");
const authRoutes = require("./routes/authRoutes");
const counterRoutes = require("./routes/counterRoutes");
const logRoutes = require("./routes/logRoutes");


const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/token", tokenRoutes);
app.use("/api/queue", queueRoutes);
app.use("/api/events", eventRoutes); 
app.use("/api/staff", staffRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/register", registrationRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/counters", counterRoutes);
app.use("/api/logs", logRoutes);

app.get("/", (req, res) => {
    res.send("QueueFlow Admission API Running");
});

const PORT = process.env.PORT || 5000;

(async () => {
    try {
        await ensureDatabase();

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to bootstrap database", error);
        process.exit(1);
    }
})();

