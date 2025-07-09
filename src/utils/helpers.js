const jwt = require("jsonwebtoken");

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

const formatResponse = (success, message, data = null) => {
  const response = { success, message };
  if (data) response.data = data;
  return response;
};

const paginate = (page, limit, total) => {
  const currentPage = parseInt(page) || 1;
  const perPage = parseInt(limit) || 10;
  const totalPages = Math.ceil(total / perPage);

  return {
    page: currentPage,
    limit: perPage,
    total,
    pages: totalPages,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  };
};

module.exports = {
  generateToken,
  formatResponse,
  paginate,
};
