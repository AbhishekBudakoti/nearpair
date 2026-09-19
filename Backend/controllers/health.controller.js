const { successResponse } = require("../utils/response");

const getHealth = async (req, res) => {
  return successResponse(
    res,
    {
      environment: process.env.NODE_ENV,
    },
    "NearPair API is running"
  );
};

module.exports = {
  getHealth,
};