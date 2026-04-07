const User = require('../models/User.model');
const jwt = require('jsonwebtoken');

class AuthService {
  // Generate JWT Token
  static generateToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  // Find or create user from OAuth profile
  static async findOrCreateUser(userData) {
    const { oauthId, provider } = userData;
    
    let user = await User.findOne({ oauthId, provider });
    
    if (!user) {
      user = new User(userData);
      await user.save();
    }
    
    return user;
  }

  // Get user profile by ID
  static async getUserProfile(userId) {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    const userProfile = {
      id: user._id,
      oauthId: user.oauthId,
      name: user.name,
      profileImg: user.profileImg,
      provider: user.provider,
      isPinned: user.isPinned,
      signatures: user.signatures,
      createdAt: user.createdAt
    };

    return userProfile;
  }

  // Refresh JWT token
  static async refreshToken(token) {
    if (!token) {
      throw new Error('No token provided');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      throw new Error('Invalid token');
    }

    const newToken = AuthService.generateToken(user._id);
    return newToken;
  }

  // Verify JWT token
  static async verifyToken(token) {
    if (!token) {
      throw new Error('No token provided');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      throw new Error('Invalid token');
    }

    return user;
  }
}

module.exports = AuthService;
