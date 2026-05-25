const express = require('express');
const router = express.Router();
const vendaController = require('../controllers/VendaController');

// Listar todas as vendas
router.get('/', vendaController.listar);

// Buscar venda por ID
router.get('/:id', vendaController.buscarPorId);

// Criar nova venda
router.post('/', vendaController.criar);

// Atualizar venda
router.put('/:id', vendaController.atualizar);

// Deletar venda
router.delete('/:id', vendaController.deletar);

module.exports = router;
