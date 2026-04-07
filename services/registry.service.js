const User = require('../models/User.model');

class RegistryService {
  // Get all users with pagination and sorting
  static async getAllUsers(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    // Find users and sort by isPinned (desc) then by latest signature timestamp (desc)
    const users = await User.find({})
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Sort manually by latest signature timestamp after fetching
    const sortedUsers = users.sort((a, b) => {
      // First sort by isPinned (pinned users first)
      if (a.isPinned !== b.isPinned) {
        return b.isPinned - a.isPinned;
      }
      
      // Then sort by latest signature timestamp
      const aLatestTime = a.signatures.length > 0 
        ? Math.max(...a.signatures.map(sig => new Date(sig.timestamp)))
        : new Date(a.createdAt);
      
      const bLatestTime = b.signatures.length > 0 
        ? Math.max(...b.signatures.map(sig => new Date(sig.timestamp)))
        : new Date(b.createdAt);
      
      return new Date(bLatestTime) - new Date(aLatestTime);
    });

    const totalUsers = await User.countDocuments();
    const totalPages = Math.ceil(totalUsers / limit);

    const paginationData = {
      currentPage: page,
      totalPages,
      totalUsers,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };

    return {
      users: sortedUsers,
      pagination: paginationData
    };
  }

  // Add a new signature for a user
  static async addSignature(userId, content) {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user has less than 3 signatures
    if (user.signatures.length >= 3) {
      throw new Error('Maximum signature limit reached (3 signatures per user)');
    }

    // Add new signature
    await user.addSignature(content);

    // Return updated user data
    const updatedUser = await User.findById(userId);
    return updatedUser;
  }

  // Update a specific signature
  static async updateSignature(userId, sigId, content) {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Check if signature exists and belongs to user
    const signature = user.signatures.find(sig => sig.id === sigId);
    
    if (!signature) {
      throw new Error('Signature not found');
    }

    // Update signature
    await user.updateSignature(sigId, content);

    // Return updated user data
    const updatedUser = await User.findById(userId);
    return updatedUser;
  }

  // Toggle pin status for a user
  static async togglePinStatus(userId) {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Toggle pin status
    user.isPinned = !user.isPinned;
    await user.save();

    return user;
  }
}

module.exports = RegistryService;
