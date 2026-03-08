// routes/dashboard.routes.js
const router = require('express').Router();
const auth   = require('../middleware/auth');
const ctrl   = require('../controllers/dashboard.controller');
router.get('/summary', auth, ctrl.getSummary);
module.exports = router;
