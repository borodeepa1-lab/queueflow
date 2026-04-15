const express = require("express");
const router = express.Router();
const registrationController = require("../controllers/registrationController");

router.get("/departments", registrationController.getDepartments);
router.post("/", registrationController.registerStudent);

module.exports = router;
