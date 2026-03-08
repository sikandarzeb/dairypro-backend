// ============================================================
// routes/auth.routes.js
// ============================================================
const router = require('express').Router();
const auth   = require('../middleware/auth');
const {
  register, login, getMe, changePassword
} = require('../controllers/auth.controller');

router.post('/register',         register);
router.post('/login',            login);
router.get('/me',                auth, getMe);
router.put('/change-password',   auth, changePassword);

module.exports = router;
