const express = require('express');
const router = express.Router();
const pagamentoController = require('../controllers/PagamentoController');

// Processar pagamento e criar venda
router.post('/', pagamentoController.processar);

module.exports = router;
