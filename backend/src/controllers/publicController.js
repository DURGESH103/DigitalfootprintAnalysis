const { pool } = require('../config/database');
const Report = require('../models/Report');
const ConnectedAccount = require('../models/ConnectedAccount');
const { cache } = require('../config/redis');
const { success, error } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

const getPublicProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const cacheKey = `public:${username}`;

  const cached = await cache.get(cacheKey);
  if (cached) return success(res, cached);

  // Find user by name (case-insensitive)
  const [[user]] = await pool.execute(
    'SELECT id, name, created_at FROM users WHERE LOWER(name) = LOWER(?)',
    [username]
  );
  if (!user) return error(res, 'Profile not found', 404);

  const [report, accounts] = await Promise.all([
    Report.findLatestByUser(user.id),
    ConnectedAccount.findByUser(user.id),
  ]);

  const profile = {
    name: user.name,
    member_since: user.created_at,
    platforms: accounts.map((a) => ({ platform: a.platform, username: a.username })),
    scores: report?.scores || null,
    persona: report?.insights?.ai?.persona || null,
    behavior_type: report?.scores?.behavior_type || null,
    skills: report?.scores?.all_skills || [],
    last_analyzed: report?.created_at || null,
  };

  await cache.set(cacheKey, profile, 600);
  return success(res, profile);
});

module.exports = { getPublicProfile };
