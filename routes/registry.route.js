const express = require('express');
const router = express.Router();
const RegistryService = require('../services/registry.service');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const {
  validateSignature,
  validateSignatureUpdate,
  validateSignatureId,
  validateUserId,
  validatePagination,
  handleValidationErrors
} = require('../middleware/validation');
const { successResponse, errorResponse, asyncHandler } = require('../utils/responseHelper');

// GET /api/registry - Fetch all users with pagination and sorting
router.get('/', validatePagination, handleValidationErrors, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const result = await RegistryService.getAllUsers(page, limit);
  return successResponse(res, 200, 'Users fetched successfully', result);
}));

// POST /api/registry/sign - Add a new signature (authenticated)
router.post('/sign', 
  authMiddleware,
  validateSignature,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { content } = req.body;
    const userId = req.user._id;

    const result = await RegistryService.addSignature(userId, content);
    return successResponse(res, 201, 'Signature added successfully', { user: result });
  })
);

// PUT /api/registry/edit/:sigId - Update a specific signature (authenticated)
router.put('/edit/:sigId',
  authMiddleware,
  validateSignatureId,
  validateSignatureUpdate,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { sigId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    const result = await RegistryService.updateSignature(userId, sigId, content);
    return successResponse(res, 200, 'Signature updated successfully', { user: result });
  })
);

// PATCH /api/registry/pin/:userId - Toggle pin status (admin only)
router.patch('/pin/:userId',
  authMiddleware,
  adminMiddleware,
  validateUserId,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const result = await RegistryService.togglePinStatus(userId);
    return successResponse(res, 200, `User ${result.isPinned ? 'pinned' : 'unpinned'} successfully`, { user: result });
  })
);

module.exports = router;
