const { verifyAccessToken } = require('../utils/jwt');
const { error } = require('../utils/response');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return error(res, 'Access token required', 401);
  }
  try {
    const token = authHeader.split(' ')[1];
    req.user = verifyAccessToken(token);
    next();
  } catch (err) {
    return error(res, err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token', 401);
  }
};

module.exports = { authenticate };
