const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/ConfiguracaoController');

router.get('/', ctrl.listar.bind(ctrl));
router.put('/', ctrl.atualizar.bind(ctrl));

module.exports = router;
