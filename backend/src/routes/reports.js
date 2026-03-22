const router = require('express').Router();
const { getLatestReport, getReportById, listReports, getAnalytics, getComparison } = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', listReports);
router.get('/analytics', getAnalytics);
router.get('/compare', getComparison);
router.get('/user/:userId', getLatestReport);
router.get('/:reportId', getReportById);

module.exports = router;
