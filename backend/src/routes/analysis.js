const router = require('express').Router();
const { triggerAnalysis, getJobStatus } = require('../controllers/analysisController');
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../validators');

router.use(authenticate);
router.post('/', validate(schemas.analyze), triggerAnalysis);
router.get('/job/:jobId', getJobStatus);

module.exports = router;
