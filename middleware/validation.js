const { body, param, validationResult,query } = require('express-validator');

// Validation for adding a signature
const validateSignature = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 256 })
    .withMessage('Signature content must be between 1 and 256 characters')
    .escape(),
];

// Validation for updating a signature
const validateSignatureUpdate = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 256 })
    .withMessage('Signature content must be between 1 and 256 characters')
    .escape(),
];

// Validation for signature ID parameter
const validateSignatureId = [
  param('sigId')
    .isUUID()
    .withMessage('Invalid signature ID format'),
];

// Validation for user ID parameter
const validateUserId = [
  param('userId')
    .isMongoId()
    .withMessage('Invalid user ID format'),
];

// Validation for pagination parameters
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
];

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

module.exports = {
  validateSignature,
  validateSignatureUpdate,
  validateSignatureId,
  validateUserId,
  validatePagination,
  handleValidationErrors
};
