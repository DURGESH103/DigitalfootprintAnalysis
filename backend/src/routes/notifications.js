const router = require('express').Router();
const { getNotifications, markRead } = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', getNotifications);
router.patch('/all/read', (req, res, next) => {
  req.params.id = 'all';
  next();
}, markRead);
router.patch('/:id/read', markRead);

module.exports = router;
