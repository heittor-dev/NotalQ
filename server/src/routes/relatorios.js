const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/RelatorioController');

router.get('/vendas', ctrl.vendasPorPeriodo.bind(ctrl));
router.get('/produtos-mais-vendidos', ctrl.produtosMaisVendidos.bind(ctrl));
router.get('/faturamento-diario', ctrl.faturamentoDiario.bind(ctrl));
router.get('/financeiro', ctrl.resumoFinanceiro.bind(ctrl));

module.exports = router;
