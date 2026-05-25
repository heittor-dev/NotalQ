const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/AuthController');

router.post('/registro', ctrl.registrar.bind(ctrl));
router.post('/login', ctrl.login.bind(ctrl));

module.exports = router;
