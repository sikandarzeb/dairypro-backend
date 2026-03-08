// routes/sales.routes.js
const router = require('express').Router();
const auth   = require('../middleware/auth');
const ctrl   = require('../controllers/sales.controller');

router.get('/',              auth, ctrl.getAll);
router.get('/:id',           auth, ctrl.getOne);
router.post('/',             auth, ctrl.create);
router.patch('/:id/status',  auth, ctrl.updateStatus);
router.delete('/:id',        auth, ctrl.remove);

module.exports = router;
