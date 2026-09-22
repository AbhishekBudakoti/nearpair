const ContactMessage = require("../models/contactMessage.model");
const { successResponse } = require("../utils/response");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * @desc    Submit a message from the public Contact page
 * @route   POST /api/contact
 * @access  Public
 */
const submitContactMessage = async (req, res) => {
  let { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    const error = new Error("Name, email, subject and message are required");
    error.statusCode = 400;
    throw error;
  }

  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof subject !== "string" ||
    typeof message !== "string"
  ) {
    const error = new Error("Name, email, subject and message must be text");
    error.statusCode = 400;
    throw error;
  }

  email = email.toLowerCase().trim();
  if (!EMAIL_RE.test(email)) {
    const error = new Error("Enter a valid email address");
    error.statusCode = 400;
    throw error;
  }

  await ContactMessage.create({ name, email, subject, message });

  return successResponse(res, {}, "Message sent — we'll get back to you soon", 201);
};

module.exports = { submitContactMessage };
