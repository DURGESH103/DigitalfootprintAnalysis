const axios = require('axios');

const BASE = 'https://api.github.com';

const githubClient = (token) =>
  axios.create({
    baseURL: BASE,
    headers: {
      // Use token if provided, otherwise make unauthenticated request (60 req/hr limit)
      ...(token && token !== 'your_github_personal_access_token'
        ? { Authorization: `Bearer ${token}` }
        : {}),
      Accept: 'application/vnd.github.v3+json',
    },
  });

const fetchGitHubData = async (username, token) => {
  const client = githubClient(token);

  const [userRes, reposRes] = await Promise.all([
    client.get(`/users/${username}`),
    client.get(`/users/${username}/repos?per_page=100&sort=updated`),
  ]);

  const user = userRes.data;
  const repos = reposRes.data;

  const languageMap = {};
  const langResults = await Promise.all(
    repos.filter((r) => !r.fork).slice(0, 20).map((r) =>
      client.get(`/repos/${username}/${r.name}/languages`).catch(() => ({ data: {} }))
    )
  );
  langResults.forEach(({ data }) => {
    Object.entries(data).forEach(([lang, bytes]) => {
      languageMap[lang] = (languageMap[lang] || 0) + bytes;
    });
  });

  let commitActivity = [];
  try {
    const { data } = await client.get(`/repos/${username}/${repos[0]?.name}/stats/commit_activity`);
    commitActivity = data || [];
  } catch (_) {}

  return {
    profile: {
      login: user.login,
      name: user.name,
      bio: user.bio,
      followers: user.followers,
      following: user.following,
      public_repos: user.public_repos,
      created_at: user.created_at,
    },
    repos: repos.slice(0, 50).map((r) => ({
      name: r.name,
      stars: r.stargazers_count,
      forks: r.forks_count,
      language: r.language,
      updated_at: r.updated_at,
      is_fork: r.fork,
    })),
    languages: languageMap,
    total_stars: repos.reduce((s, r) => s + r.stargazers_count, 0),
    total_forks: repos.reduce((s, r) => s + r.forks_count, 0),
    commit_activity: commitActivity,
  };
};

module.exports = { fetchGitHubData };
