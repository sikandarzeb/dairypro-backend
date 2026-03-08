// routes/inventory.routes.js
const router = require('express').Router();
const auth   = require('../middleware/auth');
const ctrl   = require('../controllers/inventory.controller');
router.get('/',  auth, ctrl.getAll);
router.post('/', auth, ctrl.upsert);
module.exports = router;
