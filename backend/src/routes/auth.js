const router = require('express').Router();
const { signup, login, refresh, logout, me } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../validators');

router.post('/signup', validate(schemas.signup), signup);
router.post('/login', validate(schemas.login), login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authenticate, me);

module.exports = router;
