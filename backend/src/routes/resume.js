const router = require('express').Router();
const { uploadResume } = require('../controllers/resumeController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.post('/upload', uploadResume);

module.exports = router;
