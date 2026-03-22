const axios = require('axios');

const CF_BASE = 'https://codeforces.com/api';

const fetchCodeforcesData = async (username) => {
  const [infoRes, ratingRes, submissionsRes] = await Promise.all([
    axios.get(`${CF_BASE}/user.info?handles=${username}`),
    axios.get(`${CF_BASE}/user.rating?handle=${username}`),
    axios.get(`${CF_BASE}/user.status?handle=${username}&from=1&count=500`),
  ]);

  if (infoRes.data.status !== 'OK') throw new Error(`Codeforces user '${username}' not found`);

  const user = infoRes.data.result[0];
  const ratingHistory = ratingRes.data.result || [];
  const submissions = submissionsRes.data.result || [];

  const solved = new Set(
    submissions.filter((s) => s.verdict === 'OK').map((s) => `${s.problem.contestId}-${s.problem.index}`)
  );

  const tagMap = {};
  submissions
    .filter((s) => s.verdict === 'OK')
    .forEach((s) => {
      (s.problem.tags || []).forEach((tag) => {
        tagMap[tag] = (tagMap[tag] || 0) + 1;
      });
    });

  const ratingChanges = ratingHistory.map((r) => ({
    contest: r.contestName,
    old_rating: r.oldRating,
    new_rating: r.newRating,
    rank: r.rank,
    date: new Date(r.ratingUpdateTimeSeconds * 1000).toISOString(),
  }));

  return {
    username,
    handle: user.handle,
    rating: user.rating || 0,
    max_rating: user.maxRating || 0,
    rank: user.rank || 'unrated',
    max_rank: user.maxRank || 'unrated',
    contribution: user.contribution || 0,
    friends_count: user.friendOfCount || 0,
    problems_solved: solved.size,
    contests_attended: ratingHistory.length,
    rating_history: ratingChanges.slice(-20),
    top_tags: Object.entries(tagMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count })),
  };
};

module.exports = { fetchCodeforcesData };
