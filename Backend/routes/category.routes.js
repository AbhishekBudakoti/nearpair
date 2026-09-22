const express = require("express");

const { getCategories } = require("../controllers/category.controller");

const asyncHandler = require("../middlewares/asyncHandler");

const router = express.Router();

router.get("/", asyncHandler(getCategories));

module.exports = router;
