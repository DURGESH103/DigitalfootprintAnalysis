const axios = require('axios');

const LEETCODE_GQL = 'https://leetcode.com/graphql';

const query = `
query getUserProfile($username: String!) {
  matchedUser(username: $username) {
    username
    submitStats: submitStatsGlobal {
      acSubmissionNum { difficulty count submissions }
    }
    profile { ranking reputation starRating }
    badges { name }
    userCalendar { streak totalActiveDays submissionCalendar }
  }
  userContestRanking(username: $username) {
    attendedContestsCount rating globalRanking topPercentage
  }
}`;

const fetchLeetCodeData = async (username) => {
  const { data } = await axios.post(
    LEETCODE_GQL,
    { query, variables: { username } },
    { headers: { 'Content-Type': 'application/json', Referer: 'https://leetcode.com' } }
  );

  const user = data?.data?.matchedUser;
  const contest = data?.data?.userContestRanking;

  if (!user) throw new Error(`LeetCode user '${username}' not found`);

  const stats = {};
  (user.submitStats?.acSubmissionNum || []).forEach(({ difficulty, count }) => {
    stats[difficulty.toLowerCase()] = count;
  });

  return {
    username,
    solved: {
      easy: stats.easy || 0,
      medium: stats.medium || 0,
      hard: stats.hard || 0,
      total: stats.all || 0,
    },
    ranking: user.profile?.ranking || 0,
    reputation: user.profile?.reputation || 0,
    contest: {
      attended: contest?.attendedContestsCount || 0,
      rating: contest?.rating || 0,
      global_ranking: contest?.globalRanking || 0,
      top_percentage: contest?.topPercentage || null,
    },
    streak: user.userCalendar?.streak || 0,
    active_days: user.userCalendar?.totalActiveDays || 0,
    badges: (user.badges || []).map((b) => b.name),
  };
};

module.exports = { fetchLeetCodeData };
