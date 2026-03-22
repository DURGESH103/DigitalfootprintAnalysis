const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { analyzeResume } = require('../services/aiClient');
const { NormalizedData } = require('../models/PlatformData');
const { success, error } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`),
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.txt', '.doc', '.docx'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Only PDF, TXT, DOC, DOCX files are allowed'));
  },
}).single('resume');

const uploadResume = asyncHandler(async (req, res) => {
  await new Promise((resolve, reject) => upload(req, res, (err) => (err ? reject(err) : resolve())));

  if (!req.file) return error(res, 'No file uploaded', 400);

  const resumeText = fs.readFileSync(req.file.path, 'utf-8').substring(0, 5000);
  const normalizedList = await NormalizedData.findByUser(req.user.id);
  const userSkills = [...new Set(normalizedList.flatMap((n) => n.skill_tags))];

  let analysis;
  try {
    analysis = await analyzeResume(resumeText, userSkills);
  } catch {
    analysis = {
      matched_skills: userSkills.slice(0, 5),
      missing_skills: ['cloud', 'system-design'],
      resume_score: 65,
      suggestions: ['Add more project descriptions', 'Include measurable achievements'],
      generated_by: 'fallback',
    };
  }

  // Cleanup uploaded file
  fs.unlink(req.file.path, () => {});

  return success(res, { analysis, user_skills: userSkills });
});

module.exports = { uploadResume };
