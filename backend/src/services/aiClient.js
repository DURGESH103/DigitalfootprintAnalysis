const axios = require('axios');

const aiClient = axios.create({
  baseURL: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

const getAIInsights = async (payload) => {
  const { data } = await aiClient.post('/analyze', payload);
  return data;
};

const analyzeResume = async (resumeText, userSkills) => {
  const { data } = await aiClient.post('/resume', { resume_text: resumeText, user_skills: userSkills });
  return data;
};

module.exports = { getAIInsights, analyzeResume };
