const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Signature Sub-document Schema
const signatureSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => uuidv4(),
    unique: true
  },
  content: {
    type: String,
    required: [true, 'Signature content is required'],
    maxlength: [256, 'Signature content cannot exceed 256 characters'],
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// Main User Schema
const userSchema = new mongoose.Schema({
  oauthId: {
    type: String,
    required: [true, 'OAuth ID is required'],
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  profileImg: {
    type: String,
    required: [true, 'Profile image URL is required'],
    trim: true
  },
  provider: {
    type: String,
    required: [true, 'Provider is required'],
    enum: ['github', 'google', 'linkedin'],
    lowercase: true
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  signatures: {
    type: [signatureSchema],
    default: [],
    validate: {
      validator: function(signatures) {
        return signatures.length <= 3;
      },
      message: 'Maximum of 3 signatures allowed per user'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for latest signature timestamp (used for sorting)
userSchema.virtual('latestSignatureTimestamp').get(function() {
  if (this.signatures.length === 0) {
    return this.createdAt;
  }
  return Math.max(...this.signatures.map(sig => sig.timestamp.getTime()));
});

// Index for optimized queries
userSchema.index({ isPinned: -1, latestSignatureTimestamp: -1 });
userSchema.index({ oauthId: 1, provider: 1 });

// Static method to find or create user
userSchema.statics.findOrCreate = async function(userData) {
  const { oauthId, provider } = userData;
  
  let user = await this.findOne({ oauthId, provider });
  
  if (!user) {
    user = new this(userData);
    await user.save();
  }
  
  return user;
};

// Instance method to add signature with validation
userSchema.methods.addSignature = function(content) {
  if (this.signatures.length >= 3) {
    throw new Error('Maximum signature limit reached (3 signatures per user)');
  }
  
  this.signatures.push({ content });
  return this.save();
};

// Instance method to update signature
userSchema.methods.updateSignature = function(sigId, content) {
  const signature = this.signatures.find(sig => sig.id === sigId);
  
  if (!signature) {
    throw new Error('Signature not found');
  }
  
  signature.content = content;
  return this.save();
};

// Pre-save middleware to ensure signature limit
userSchema.pre('save', function(next) {
  if (this.signatures.length > 3) {
    const error = new Error('Maximum of 3 signatures allowed per user');
    return next(error);
  }
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
