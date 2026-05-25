const express = require('express');
const router = express.Router();
const produtoController = require('../controllers/ProdutoController');
const Produto = require('../models/Produto');

// Alertas de estoque baixo (deve vir antes de /:id)
router.get('/alertas/estoque-baixo', async (req, res) => {
  try {
    const produtos = await Produto.listarBaixoEstoque();
    res.status(200).json({ sucesso: true, dados: produtos, total: produtos.length });
  } catch (erro) {
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao buscar alertas', erro: erro.message });
  }
});

// Listar todos os produtos
router.get('/', produtoController.listar);

// Buscar produto por ID
router.get('/:id', produtoController.buscarPorId);

// Criar novo produto
router.post('/', produtoController.criar);

// Atualizar produto
router.put('/:id', produtoController.atualizar);

// Decrementar estoque
router.put('/:id/estoque/decrementar', produtoController.decrementarEstoque);

// Incrementar estoque
router.put('/:id/estoque/incrementar', produtoController.incrementarEstoque);

// Deletar produto
router.delete('/:id', produtoController.deletar);

module.exports = router;
