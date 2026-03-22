const axios = require('axios');

const SE_BASE = 'https://api.stackexchange.com/2.3';

const fetchStackOverflowData = async (username) => {
  try {
    // Search user by display name
    const searchRes = await axios.get(`${SE_BASE}/users`, {
      params: { inname: username, site: 'stackoverflow', pagesize: 1, order: 'desc', sort: 'reputation' },
      timeout: 10000,
    });

    const users = searchRes.data?.items || [];
    if (!users.length) throw new Error(`StackOverflow user '${username}' not found`);

    const user = users[0];
    const userId = user.user_id;

    // Fetch top tags
    const tagsRes = await axios.get(`${SE_BASE}/users/${userId}/top-tags`, {
      params: { site: 'stackoverflow', pagesize: 10 },
      timeout: 10000,
    }).catch(() => ({ data: { items: [] } }));

    const topTags = (tagsRes.data?.items || []).map((t) => ({
      tag: t.tag_name,
      answer_count: t.answer_count,
      question_count: t.question_count,
    }));

    return {
      username,
      user_id: userId,
      display_name: user.display_name,
      reputation: user.reputation || 0,
      badge_counts: user.badge_counts || { gold: 0, silver: 0, bronze: 0 },
      answer_count: user.answer_count || 0,
      question_count: user.question_count || 0,
      accept_rate: user.accept_rate || 0,
      top_tags: topTags,
      profile_url: user.link,
    };
  } catch (err) {
    // Graceful fallback — don't break the whole analysis
    console.warn(`[stackoverflow] fetch failed for ${username}:`, err.message);
    return {
      username,
      reputation: 0,
      badge_counts: { gold: 0, silver: 0, bronze: 0 },
      answer_count: 0,
      question_count: 0,
      top_tags: [],
      simulated: true,
    };
  }
};

module.exports = { fetchStackOverflowData };
