const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/User.model');

// OAuth Strategies Configuration

// GitHub Strategy
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: "/api/auth/github/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const userData = {
      oauthId: profile.id,
      name: profile.displayName || profile.username,
      profileImg: profile.photos[0]?.value || '',
      provider: 'github'
    };

    const user = await User.findOrCreate(userData);
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

// Google Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const userData = {
      oauthId: profile.id,
      name: profile.displayName,
      profileImg: profile.photos[0]?.value || '',
      provider: 'google'
    };

    const user = await User.findOrCreate(userData);
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

// LinkedIn Strategy
passport.use(new LinkedInStrategy({
  clientID: process.env.LINKEDIN_CLIENT_ID,
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
  callbackURL: "/api/auth/linkedin/callback",
  scope: ['r_liteprofile', 'r_emailaddress']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const userData = {
      oauthId: profile.id,
      name: profile.displayName,
      profileImg: profile.photos[0]?.value || '',
      provider: 'linkedin'
    };

    const user = await User.findOrCreate(userData);
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

// JWT Strategy for API authentication
passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
}, async (payload, done) => {
  try {
    const user = await User.findById(payload.userId);
    if (!user) {
      return done(null, false);
    }
    return done(null, user);
  } catch (error) {
    return done(error, false);
  }
}));

// Serialize and deserialize user for sessions
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
