/**
 * Computes all scores from normalized platform data.
 * Returns a comprehensive scoring object.
 */

const DEV_PLATFORMS = ['github', 'gitlab'];
const CODING_PLATFORMS = ['leetcode', 'codeforces', 'codechef', 'hackerrank', 'geeksforgeeks'];
const SOCIAL_PLATFORMS = ['linkedin', 'twitter'];

const avg = (arr) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0);
const weighted = (items) => {
  const total = items.reduce((s, [, w]) => s + w, 0);
  return items.reduce((s, [v, w]) => s + v * (w / total), 0);
};

const computeScores = (normalizedList) => {
  const byPlatform = {};
  normalizedList.forEach((n) => { byPlatform[n.platform] = n; });

  const devData = DEV_PLATFORMS.map((p) => byPlatform[p]).filter(Boolean);
  const codingData = CODING_PLATFORMS.map((p) => byPlatform[p]).filter(Boolean);
  const socialData = SOCIAL_PLATFORMS.map((p) => byPlatform[p]).filter(Boolean);

  // Problem Solving Score
  const problem_solving_score = codingData.length
    ? weighted(codingData.map((d) => [
        (d.activity_score * 0.4 + d.growth_score * 0.4 + d.consistency_score * 0.2),
        1,
      ]))
    : 0;

  // Development Score
  const development_score = devData.length
    ? weighted(devData.map((d) => [
        (d.activity_score * 0.35 + d.engagement_score * 0.35 + d.consistency_score * 0.3),
        1,
      ]))
    : 0;

  // Social Presence Score
  const social_presence_score = socialData.length
    ? avg(socialData.map((d) => (d.engagement_score * 0.5 + d.activity_score * 0.3 + d.consistency_score * 0.2)))
    : 0;

  // Consistency Score (across all platforms)
  const consistency_score = avg(normalizedList.map((d) => d.consistency_score));

  // Visibility Score
  const visibility_score = weighted([
    [development_score, 0.4],
    [social_presence_score, 0.35],
    [avg(normalizedList.map((d) => d.engagement_score)), 0.25],
  ]);

  // Growth Score
  const growth_score = avg(normalizedList.map((d) => d.growth_score));

  // Hireability Score
  const hireability_score = weighted([
    [problem_solving_score, 0.3],
    [development_score, 0.3],
    [consistency_score, 0.2],
    [visibility_score, 0.1],
    [growth_score, 0.1],
  ]);

  // Behavior classification
  const devWeight = devData.length ? avg(devData.map((d) => d.activity_score)) : 0;
  const codingWeight = codingData.length ? avg(codingData.map((d) => d.activity_score)) : 0;
  const socialWeight = socialData.length ? avg(socialData.map((d) => d.activity_score)) : 0;

  let behavior_type = 'Balanced';
  const max = Math.max(devWeight, codingWeight, socialWeight);
  if (max === devWeight && devWeight > 60) behavior_type = 'Builder';
  else if (max === codingWeight && codingWeight > 60) behavior_type = 'Problem Solver';
  else if (max === socialWeight && socialWeight > 60) behavior_type = 'Social';

  // All skill tags merged and deduplicated
  const all_skills = [...new Set(normalizedList.flatMap((d) => d.skill_tags))];

  const round = (n) => Math.round(n * 10) / 10;

  return {
    hireability_score: round(hireability_score),
    consistency_score: round(consistency_score),
    visibility_score: round(visibility_score),
    growth_score: round(growth_score),
    problem_solving_score: round(problem_solving_score),
    development_score: round(development_score),
    social_presence_score: round(social_presence_score),
    behavior_type,
    all_skills,
    platform_breakdown: Object.fromEntries(
      normalizedList.map((d) => [d.platform, {
        activity: round(d.activity_score),
        consistency: round(d.consistency_score),
        engagement: round(d.engagement_score),
        growth: round(d.growth_score),
      }])
    ),
  };
};

// Compare against benchmarks
const compareToBenchmarks = (scores) => {
  const AVERAGE_DEV = {
    hireability_score: 45,
    problem_solving_score: 40,
    development_score: 42,
    consistency_score: 38,
    visibility_score: 30,
  };
  const TOP_10_PERCENT = {
    hireability_score: 80,
    problem_solving_score: 78,
    development_score: 82,
    consistency_score: 75,
    visibility_score: 70,
  };

  const comparison = {};
  Object.keys(AVERAGE_DEV).forEach((key) => {
    comparison[key] = {
      your_score: scores[key] || 0,
      vs_average: round2(scores[key] - AVERAGE_DEV[key]),
      vs_top10: round2(scores[key] - TOP_10_PERCENT[key]),
      percentile: estimatePercentile(scores[key] || 0, key),
    };
  });
  return comparison;
};

const round2 = (n) => Math.round(n * 100) / 100;

const estimatePercentile = (score, metric) => {
  // Simple linear estimation
  if (score >= 90) return 95;
  if (score >= 80) return 85;
  if (score >= 70) return 75;
  if (score >= 60) return 60;
  if (score >= 50) return 50;
  if (score >= 40) return 35;
  return 20;
};

module.exports = { computeScores, compareToBenchmarks };
