const router = require('express').Router();
const { connectAccount, getAccounts, disconnectAccount } = require('../controllers/accountController');
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../validators');

router.use(authenticate);
router.post('/', validate(schemas.connectAccount), connectAccount);
router.get('/', getAccounts);
router.delete('/:platform', disconnectAccount);

module.exports = router;
