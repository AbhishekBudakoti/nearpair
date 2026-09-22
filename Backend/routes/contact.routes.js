const express = require("express");

const { submitContactMessage } = require("../controllers/contact.controller");
const asyncHandler = require("../middlewares/asyncHandler");

const router = express.Router();

router.post("/", asyncHandler(submitContactMessage));

module.exports = router;
