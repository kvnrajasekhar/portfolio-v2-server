const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/User.model');

// OAuth Strategies Configuration

// GitHub Strategy
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: process.env.GITHUB_CALLBACK_URL
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
  callbackURL: process.env.GOOGLE_CALLBACK_URL
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
const OpenIDConnectStrategy = require('passport-openidconnect').Strategy;

passport.use('linkedin', new OpenIDConnectStrategy({
  issuer: 'https://www.linkedin.com',
  authorizationURL: 'https://www.linkedin.com/oauth/v2/authorization',
  tokenURL: 'https://www.linkedin.com/oauth/v2/accessToken',
  userInfoURL: 'https://api.linkedin.com/v2/userinfo',
  clientID: process.env.LINKEDIN_CLIENT_ID,
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
  callbackURL: process.env.LINKEDIN_CALLBACK_URL,
  scope: ['openid', 'profile', 'email']
}, (issuer, profile, done) => {
  // OIDC profile normalization is standard
  const userData = {
    oauthId: profile.id, // The 'sub' or unique ID
    name: profile.displayName,
    profileImg: profile.photos?.[0]?.value || profile._json?.picture,
    provider: 'linkedin'
  };

  // Your DB logic here
  return User.findOrCreate(userData)
    .then(user => done(null, user))
    .catch(err => done(err));
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
