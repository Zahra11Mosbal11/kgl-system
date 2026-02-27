const jwt = require('jsonwebtoken');

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'You must log in first' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Generic role check middleware
const requireRoles = (allowedRoles) => {
  return (req, res, next) => {
    requireAuth(req, res, () => {
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ error: `This process is for ${allowedRoles.join(' or ')} only` });
      }
      next();
    });
  };
};

// check if logged in and check if user is manager
const requireManager = requireRoles(['manager']);

// check if logged in and check if user is sales agent
const requireSalesAgent = requireRoles(['sales_agent']);

// check if logged in and check if user is director
const requireDirector = requireRoles(['director']);

module.exports = {
  requireAuth,
  requireRoles,
  requireManager,
  requireSalesAgent,
  requireDirector
};