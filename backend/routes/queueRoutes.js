const express = require("express");
const router = express.Router();

const queueController = require("../controllers/queueController");

router.get("/next", queueController.getNextToken);
router.post("/start", queueController.startToken);
router.post("/complete", queueController.completeToken);
router.post("/skip", queueController.skipToken);
router.get("/now-serving", queueController.nowServing);
router.get("/all-tokens", queueController.getAllTokens);

module.exports = router;