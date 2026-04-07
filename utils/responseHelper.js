/**
 * Standardizes successful API response formatting.
 * @param {object} res - The Express response object.
 * @param {number} statusCode - The HTTP status code (e.g., 200, 201).
 * @param {string} message - A brief description of the outcome.
 * @param {object | array} data - The primary data payload.
 */
const successResponse = (res, statusCode, message, data = {}) => {
    return res.status(statusCode).json({
        success: true,
        statusCode: statusCode,
        message: message,
        data: data
    });
};

/**
 * Standardizes error API response formatting.
 * @param {object} res - The Express response object.
 * @param {number} statusCode - The HTTP status code (e.g., 400, 401, 500).
 * @param {string} message - A brief description of the error.
 * @param {object | array} errors - Details of the error (e.g., validation errors).
 */
const errorResponse = (res, statusCode, message, errors = []) => {
    return res.status(statusCode).json({
        success: false,
        statusCode: statusCode,
        message: message,
        errors: errors
    });
};

/**
 * Async handler wrapper to eliminate try-catch blocks in routes
 * @param {Function} fn - Async route handler function
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
    successResponse,
    errorResponse,
    asyncHandler
};
