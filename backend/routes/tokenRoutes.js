const express = require("express");
const router = express.Router();
const tokenController = require("../controllers/tokenController");

router.post("/generate", tokenController.generateToken);

module.exports = router;