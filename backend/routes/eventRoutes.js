const express = require("express");
const router = express.Router();

const eventController = require("../controllers/eventController");

router.get("/", eventController.getEvents);
router.post("/", eventController.createEvent);
router.delete("/:eventId", eventController.deleteEvent);

module.exports = router;
