const express = require("express");
const router = express.Router();
const counterController = require("../controllers/counterController");

router.get("/", counterController.getCounters);
router.post("/", counterController.createCounter);

module.exports = router;
