const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const User = require('../models/User'); // Adjust path if User model is elsewhere

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'fallback_secret_for_jwt_should_be_in_env', // Ensure JWT_SECRET is in .env
  // issuer: 'optional_issuer', // Optional: if you set issuer during token generation
  // audience: 'optional_audience' // Optional: if you set audience
};

passport.use(new JwtStrategy(options, async (jwt_payload, done) => {
  try {
    const user = await User.findById(jwt_payload.id);
    if (user) {
      // Attach a lean user object or specific fields to req.user
      // For example: { id: user._id, role: user.role, email: user.email }
      // Avoid attaching the full Mongoose user object directly if not needed
      return done(null, { id: user._id, role: user.role, email: user.email });
    } else {
      return done(null, false, { message: 'User not found.' });
      // Or return done(null, false) if you don't want to pass a message
    }
  } catch (error) {
    return done(error, false, { message: 'Error authenticating user.' });
  }
}));

// Middleware function to protect routes
const authenticateToken = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      return next(err); // Pass system errors to the main error handler
    }
    if (!user) {
      // If info contains a message (e.g., from strategy 'done' callback), use it.
      // Otherwise, provide a generic message.
      const message = info && info.message ? info.message : 'Unauthorized: Invalid or missing token.';
      return res.status(401).json({ message });
    }
    req.user = user; // Attach user to request object
    next();
  })(req, res, next);
};

// Optional: Middleware to authorize based on roles
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: 'Forbidden: Role not available.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: `Forbidden: Role ${req.user.role} is not authorized for this resource.` });
    }
    next();
  };
};


module.exports = {
  initializePassport: passport.initialize(), // For initializing passport in app
  authenticateToken,
  authorizeRoles
};
