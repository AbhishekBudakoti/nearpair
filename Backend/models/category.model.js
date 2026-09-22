const mongoose = require("mongoose");

/**
 * A top-level grouping for Activity documents (e.g. "Sports", "Fitness"),
 * used to organize the activity picker into category -> subcategory.
 */
const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Category name is required"],
            unique: true,
            trim: true,
            maxlength: [50, "Category name cannot exceed 50 characters"],
        },
        emoji: {
            type: String,
            trim: true,
            default: "",
        },
        order: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
