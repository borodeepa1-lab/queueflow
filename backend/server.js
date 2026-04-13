const express = require("express");
const cors = require("cors");
const db = require("./config/db");

const tokenRoutes = require("./routes/tokenRoutes");
const queueRoutes = require("./routes/queueRoutes");
const eventRoutes = require("./routes/eventRoutes"); 
const staffRoutes = require("./routes/staffRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");


const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/token", tokenRoutes);
app.use("/api/queue", queueRoutes);
app.use("/api/events", eventRoutes); 
app.use("/api/staff", staffRoutes);
app.use("/api/analytics", analyticsRoutes);

app.get("/", (req, res) => {
    res.send("QueueFlow Admission API Running");
});

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

