const express = require("express");
const router = express.Router();

const staffController = require("../controllers/staffController");

router.get("/", staffController.getStaff);
router.post("/", staffController.assignStaff);
router.post("/login", staffController.login);
router.delete("/:staffId", staffController.deleteStaff);

module.exports = router;
