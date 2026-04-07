const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const AuthService = require('../services/auth.service');
const { authMiddleware } = require('../middleware/auth');
const { successResponse, errorResponse, asyncHandler } = require('../utils/responseHelper');

// GitHub OAuth Routes
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

router.get('/github/callback', 
  passport.authenticate('github', { session: false }),
  asyncHandler(async (req, res) => {
    const token = AuthService.generateToken(req.user._id);
    
    // Redirect to frontend with token
    const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${token}&provider=github`;
    res.redirect(redirectUrl);
  })
);

// Google OAuth Routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  asyncHandler(async (req, res) => {
    const token = AuthService.generateToken(req.user._id);
    
    // Redirect to frontend with token
    const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${token}&provider=google`;
    res.redirect(redirectUrl);
  })
);

// LinkedIn OAuth Routes
router.get('/linkedin', passport.authenticate('linkedin', { scope: ['r_liteprofile', 'r_emailaddress'] }));

router.get('/linkedin/callback',
  passport.authenticate('linkedin', { session: false }),
  asyncHandler(async (req, res) => {
    const token = AuthService.generateToken(req.user._id);
    
    // Redirect to frontend with token
    const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${token}&provider=linkedin`;
    res.redirect(redirectUrl);
  })
);

// Get current user profile (protected route)
router.get('/profile', authMiddleware, asyncHandler(async (req, res) => {
  const result = await AuthService.getUserProfile(req.user._id);
  return successResponse(res, 200, 'Profile fetched successfully', { user: result });
}));

// Refresh token endpoint
router.post('/refresh', asyncHandler(async (req, res) => {
  const { token } = req.body;
  
  const result = await AuthService.refreshToken(token);
  return successResponse(res, 200, 'Token refreshed successfully', { token: result });
}));

// Logout endpoint (client-side token removal)
router.post('/logout', (req, res) => {
  return successResponse(res, 200, 'Logout successful');
});

module.exports = router;
