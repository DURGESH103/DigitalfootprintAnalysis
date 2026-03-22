const ConnectedAccount = require('../models/ConnectedAccount');
const { success, error } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

const connectAccount = asyncHandler(async (req, res) => {
  const { platform, username, access_token } = req.body;
  await ConnectedAccount.upsert(req.user.id, platform, username, access_token || null);
  return success(res, { platform, username }, `${platform} account connected`, 201);
});

const getAccounts = asyncHandler(async (req, res) => {
  const accounts = await ConnectedAccount.findByUser(req.user.id);
  return success(res, { accounts });
});

const disconnectAccount = asyncHandler(async (req, res) => {
  const { platform } = req.params;
  const account = await ConnectedAccount.findOne(req.user.id, platform);
  if (!account) return error(res, 'Account not connected', 404);
  await ConnectedAccount.delete(req.user.id, platform);
  return success(res, {}, `${platform} disconnected`);
});

module.exports = { connectAccount, getAccounts, disconnectAccount };
