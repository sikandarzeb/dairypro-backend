// ============================================================
// routes/milk.routes.js
// ============================================================
const router = require('express').Router();
const auth   = require('../middleware/auth');
const ctrl   = require('../controllers/milk.controller');

router.get('/',        auth, ctrl.getAll);
router.get('/today',   auth, ctrl.getToday);
router.get('/weekly',  auth, ctrl.getWeekly);
router.post('/',       auth, ctrl.create);
router.delete('/:id',  auth, ctrl.remove);

module.exports = router;
