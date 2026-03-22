/**
 * Analyzes normalized data to detect patterns, skills, and behavior.
 */

const analyzePatterns = (normalizedList, rawDataMap) => {
  const github = rawDataMap['github'];

  // Active time analysis from commit activity
  let active_time = 'unknown';
  if (github?.commit_activity?.length) {
    const totalCommits = github.commit_activity.reduce((s, w) => s + w.total, 0);
    active_time = totalCommits > 0 ? 'regular' : 'irregular';
  }

  const allConsistency = normalizedList.map((d) => d.consistency_score);
  const avgConsistency = allConsistency.reduce((s, v) => s + v, 0) / (allConsistency.length || 1);

  return {
    active_time,
    consistency: avgConsistency > 60 ? 'high' : avgConsistency > 30 ? 'medium' : 'low',
    work_frequency: avgConsistency > 70 ? 'daily' : avgConsistency > 40 ? 'weekly' : 'occasional',
    platforms_active: normalizedList.length,
  };
};

const analyzeSkills = (normalizedList, rawDataMap) => {
  const github = rawDataMap['github'];
  const leetcode = rawDataMap['leetcode'];
  const codeforces = rawDataMap['codeforces'];

  const tech_stack = github
    ? Object.entries(github.languages || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([lang]) => lang)
    : [];

  const dsa_score = (() => {
    let score = 0;
    if (leetcode) score += Math.min(50, (leetcode.solved?.hard || 0) * 2 + (leetcode.solved?.medium || 0) * 0.5);
    if (codeforces) score += Math.min(50, (codeforces.rating || 0) / 60);
    return Math.min(100, score);
  })();

  const dev_score = github
    ? Math.min(100, (github.repos?.filter((r) => !r.is_fork).length || 0) * 3)
    : 0;

  return {
    tech_stack,
    dsa_score: Math.round(dsa_score),
    dev_score: Math.round(dev_score),
    balance: dsa_score > dev_score + 20 ? 'DSA-heavy' : dev_score > dsa_score + 20 ? 'Dev-heavy' : 'Balanced',
    problem_solving_strength: dsa_score > 70 ? 'strong' : dsa_score > 40 ? 'moderate' : 'developing',
  };
};

const analyzeGrowth = (normalizedList, rawDataMap) => {
  const codeforces = rawDataMap['codeforces'];
  const leetcode = rawDataMap['leetcode'];

  let trend = 'stable';
  let rating_trend = null;

  if (codeforces?.rating_history?.length >= 3) {
    const history = codeforces.rating_history;
    const recent = history.slice(-3).map((r) => r.new_rating);
    const older = history.slice(-6, -3).map((r) => r.new_rating);
    const recentAvg = recent.reduce((s, v) => s + v, 0) / recent.length;
    const olderAvg = older.length ? older.reduce((s, v) => s + v, 0) / older.length : recentAvg;
    rating_trend = recentAvg - olderAvg;
    trend = rating_trend > 50 ? 'improving' : rating_trend < -50 ? 'declining' : 'stable';
  }

  const avgGrowth = normalizedList.reduce((s, d) => s + d.growth_score, 0) / (normalizedList.length || 1);

  return {
    trend,
    rating_trend,
    growth_velocity: avgGrowth > 70 ? 'fast' : avgGrowth > 40 ? 'moderate' : 'slow',
    recommendation: trend === 'declining' ? 'Focus on consistent practice' : trend === 'improving' ? 'Keep up the momentum' : 'Push harder to break plateaus',
  };
};

const runAnalysisEngine = (normalizedList, rawDataMap) => ({
  patterns: analyzePatterns(normalizedList, rawDataMap),
  skills: analyzeSkills(normalizedList, rawDataMap),
  growth: analyzeGrowth(normalizedList, rawDataMap),
});

module.exports = { runAnalysisEngine };
