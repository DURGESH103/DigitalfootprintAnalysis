/**
 * Normalizes raw platform data into a unified scoring format.
 * All scores are 0-100.
 */

const normalizeGitHub = (data) => {
  const { profile, repos, languages, total_stars, commit_activity } = data;

  const recentRepos = repos.filter((r) => !r.is_fork).length;
  const activity_score = Math.min(100, (recentRepos / 30) * 100);

  // Consistency: weeks with commits in last year
  const activity = Array.isArray(commit_activity) ? commit_activity : [];
  const activeWeeks = activity.filter((w) => w.total > 0).length;
  const consistency_score = Math.min(100, (activeWeeks / 52) * 100);

  const totalBytes = Object.values(languages).reduce((s, v) => s + v, 0);
  const skill_tags = Object.entries(languages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([lang]) => lang.toLowerCase());

  const engagement_score = Math.min(100, (total_stars / 50) * 100);
  const growth_score = Math.min(100, ((profile.followers || 0) / 100) * 100);

  return { platform: 'github', activity_score, consistency_score, skill_tags, engagement_score, growth_score };
};

const normalizeLeetCode = (data) => {
  const { solved, contest, streak, active_days } = data;

  const total = solved.total || solved.easy + solved.medium + solved.hard;
  const activity_score = Math.min(100, (total / 500) * 100);
  const consistency_score = Math.min(100, (streak / 30) * 100);

  const skill_tags = ['algorithms', 'data-structures', 'dynamic-programming'];
  if (solved.hard > 50) skill_tags.push('advanced-algorithms');
  if (solved.medium > 100) skill_tags.push('problem-solving');

  const engagement_score = Math.min(100, (contest.attended / 20) * 100);
  const growth_score = Math.min(100, ((contest.rating || 1500) / 3000) * 100);

  return { platform: 'leetcode', activity_score, consistency_score, skill_tags, engagement_score, growth_score };
};

const normalizeCodeforces = (data) => {
  const { rating, problems_solved, contests_attended, top_tags } = data;

  const activity_score = Math.min(100, (problems_solved / 300) * 100);
  const consistency_score = Math.min(100, (contests_attended / 50) * 100);
  const skill_tags = top_tags.slice(0, 8).map((t) => t.tag.toLowerCase().replace(/\s+/g, '-'));
  const engagement_score = Math.min(100, (contests_attended / 30) * 100);
  const growth_score = Math.min(100, (rating / 3000) * 100);

  return { platform: 'codeforces', activity_score, consistency_score, skill_tags, engagement_score, growth_score };
};

const normalizeCodeChef = (data) => {
  const { rating, problems_solved, contests_attended, stars } = data;

  const activity_score = Math.min(100, (problems_solved / 200) * 100);
  const consistency_score = Math.min(100, (contests_attended / 30) * 100);
  const skill_tags = ['competitive-programming', 'algorithms'];
  const engagement_score = Math.min(100, (stars / 5) * 100);
  const growth_score = Math.min(100, (rating / 2500) * 100);

  return { platform: 'codechef', activity_score, consistency_score, skill_tags, engagement_score, growth_score };
};

const normalizeHackerRank = (data) => {
  const { scores, badges } = data;
  const totalScore = scores.reduce((s, sc) => s + (sc.score || 0), 0);

  const activity_score = Math.min(100, (totalScore / 3000) * 100);
  const consistency_score = Math.min(100, (badges.length / 10) * 100);
  const skill_tags = scores.map((s) => s.track?.toLowerCase().replace(/\s+/g, '-')).filter(Boolean);
  const engagement_score = Math.min(100, (badges.length / 5) * 100);
  const growth_score = activity_score * 0.8;

  return { platform: 'hackerrank', activity_score, consistency_score, skill_tags, engagement_score, growth_score };
};

const normalizeLinkedIn = (data) => {
  const { posts_count, connections, engagement_rate, recent_posts } = data;

  const activity_score = Math.min(100, (posts_count / 50) * 100);
  const consistency_score = Math.min(100, engagement_rate * 20);
  const skill_tags = ['networking', 'professional', 'social'];
  const engagement_score = Math.min(100, (connections / 500) * 100);
  const growth_score = Math.min(100, engagement_rate * 15);

  return { platform: 'linkedin', activity_score, consistency_score, skill_tags, engagement_score, growth_score };
};

const normalizeTwitter = (data) => {
  const { tweets_count, followers, avg_likes, tech_tweet_ratio } = data;

  const activity_score = Math.min(100, (tweets_count / 500) * 100);
  const consistency_score = Math.min(100, tech_tweet_ratio * 100);
  const skill_tags = ['social-media', 'tech-community'];
  const engagement_score = Math.min(100, (avg_likes / 50) * 100);
  const growth_score = Math.min(100, (followers / 2000) * 100);

  return { platform: 'twitter', activity_score, consistency_score, skill_tags, engagement_score, growth_score };
};

const normalizeStackOverflow = (data) => {
  const { reputation, answer_count, badge_counts, top_tags } = data;

  const activity_score = Math.min(100, (answer_count / 200) * 100);
  const consistency_score = Math.min(100, (reputation / 10000) * 100);
  const skill_tags = (top_tags || []).slice(0, 8).map((t) => t.tag.toLowerCase());
  const engagement_score = Math.min(100, (reputation / 5000) * 100);
  const growth_score = Math.min(100,
    ((badge_counts?.gold || 0) * 10 + (badge_counts?.silver || 0) * 3 + (badge_counts?.bronze || 0)) / 50 * 100
  );

  return { platform: 'stackoverflow', activity_score, consistency_score, skill_tags, engagement_score, growth_score };
};

const NORMALIZERS = {
  github: normalizeGitHub,
  leetcode: normalizeLeetCode,
  codeforces: normalizeCodeforces,
  codechef: normalizeCodeChef,
  hackerrank: normalizeHackerRank,
  linkedin: normalizeLinkedIn,
  twitter: normalizeTwitter,
  stackoverflow: normalizeStackOverflow,
};

const normalizePlatformData = (platform, rawData) => {
  const normalizer = NORMALIZERS[platform];
  if (!normalizer) throw new Error(`No normalizer for platform: ${platform}`);
  const result = normalizer(rawData);
  return { ...result, timestamp: new Date().toISOString() };
};

module.exports = { normalizePlatformData };
