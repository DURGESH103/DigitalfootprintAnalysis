const User = require('../models/User');
const { generateTokens, verifyRefreshToken } = require('../utils/jwt');
const { success, error } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findByEmail(email);
  if (existing) return error(res, 'Email already registered', 409);

  const userId = await User.create({ name, email, password });
  const { accessToken, refreshToken } = generateTokens({ id: userId, email });
  await User.saveRefreshToken(userId, refreshToken);

  return success(res, { accessToken, refreshToken, user: { id: userId, name, email } }, 'Account created', 201);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findByEmail(email);
  if (!user) return error(res, 'Invalid credentials', 401);

  const valid = await User.comparePassword(password, user.password_hash);
  if (!valid) return error(res, 'Invalid credentials', 401);

  const { accessToken, refreshToken } = generateTokens({ id: user.id, email: user.email });
  await User.saveRefreshToken(user.id, refreshToken);

  return success(res, {
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email },
  });
});

const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return error(res, 'Refresh token required', 400);

  const stored = await User.findRefreshToken(refreshToken);
  if (!stored) return error(res, 'Invalid refresh token', 401);

  try {
    const payload = verifyRefreshToken(refreshToken);
    const { accessToken, refreshToken: newRefresh } = generateTokens({ id: payload.id, email: payload.email });
    await User.deleteRefreshToken(refreshToken);
    await User.saveRefreshToken(payload.id, newRefresh);
    return success(res, { accessToken, refreshToken: newRefresh });
  } catch {
    return error(res, 'Invalid or expired refresh token', 401);
  }
});

const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) await User.deleteRefreshToken(refreshToken);
  return success(res, {}, 'Logged out');
});

const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return error(res, 'User not found', 404);
  return success(res, { user });
});

module.exports = { signup, login, refresh, logout, me };
