// routes/revenue.routes.js
const router = require('express').Router();
const auth   = require('../middleware/auth');
const ctrl   = require('../controllers/revenue.controller');
router.get('/summary',    auth, ctrl.getSummary);
router.get('/monthly',    auth, ctrl.getMonthly);
router.get('/top-buyers', auth, ctrl.getTopBuyers);
module.exports = router;

// ─────────────────────────────────────────────
// routes/inventory.routes.js  (save as separate file)
// ─────────────────────────────────────────────
// const router = require('express').Router();
// const auth   = require('../middleware/auth');
// const ctrl   = require('../controllers/inventory.controller');
// router.get('/',  auth, ctrl.getAll);
// router.post('/', auth, ctrl.upsert);
// module.exports = router;
