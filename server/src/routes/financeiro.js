const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/FinanceiroController');

router.get('/', ctrl.listar.bind(ctrl));
router.get('/resumo', ctrl.resumo.bind(ctrl));
router.post('/', ctrl.criar.bind(ctrl));
router.delete('/:id', ctrl.deletar.bind(ctrl));

module.exports = router;
