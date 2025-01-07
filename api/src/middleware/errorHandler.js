// src/middleware/errorHandler.js

const errorHandler = (err, req, res, next) => {
    console.error(err);
    res.status(500).json({
      message: 'An error occurred',
      error: err.message,
    });
  };
  
  module.exports = errorHandler;
  