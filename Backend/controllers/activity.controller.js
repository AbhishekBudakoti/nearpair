const mongoose = require("mongoose")

const Activity = require("../models/activity.model")
const Category = require("../models/category.model")

const { successResponse } = require("../utils/response")


const createActivity = async (req, res) => {
    const { name, description, category } = req.body;

    if (!name) {
        const error = new Error("Activity name is required");
        error.statusCode = 400;
        throw error;
    }

    if (!category || !mongoose.Types.ObjectId.isValid(category)) {
        const error = new Error("A valid category is required");
        error.statusCode = 400;
        throw error;
    }

    const categoryExists = await Category.exists({ _id: category });
    if (!categoryExists) {
        const error = new Error("Category not found");
        error.statusCode = 400;
        throw error;
    }

    const existingActivity = await Activity.findOne({ name: name.trim() })

    if (existingActivity) {
        const error = new Error("Activity already exist")
        error.statusCode = 409;
        throw error;
    }

    const activity = await Activity.create({
        name: name.trim(),
        description,
        category,
    })

    await activity.populate("category", "name emoji");

    return successResponse(
        res, { activity }, "Activity created successfully"
    )


};

const getActivity = async (req, res) => {
    const activities = await Activity.find({
        isActive: true
    })
        .populate("category", "name emoji")
        .sort({ name: 1 })

    return successResponse(
        res, { activities }, "Activities fetched successfully"
    )
};

module.exports = { createActivity, getActivity }