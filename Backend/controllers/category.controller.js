const Category = require("../models/category.model");

const { successResponse } = require("../utils/response");

const getCategories = async (req, res) => {
    const categories = await Category.find().sort({ order: 1, name: 1 });

    return successResponse(
        res, { categories }, "Categories fetched successfully"
    );
};

module.exports = { getCategories };
