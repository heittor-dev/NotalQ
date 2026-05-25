const Produto = require('../models/Produto');
const asyncHandler = require('../helpers/asyncHandler');
const { ok, criado, erro, naoEncontrado } = require('../helpers/response');

module.exports = {
  listar: asyncHandler(async (req, res) => {
    const produtos = await Produto.listar();
    ok(res, produtos, { total: produtos.length });
  }),

  buscarPorId: asyncHandler(async (req, res) => {
    const produto = await Produto.buscarPorId(req.params.id);
    if (!produto) return naoEncontrado(res, 'Produto');
    ok(res, produto);
  }),

  criar: asyncHandler(async (req, res) => {
    const { nome, descricao, preco, estoque, sku, categoria, estoque_minimo } = req.body;
    if (!nome || !preco) return erro(res, 'Nome e preço são obrigatórios');
    if (preco < 0) return erro(res, 'Preço não pode ser negativo');
    const resultado = await Produto.criar(nome, descricao || '', preco, estoque || 0, sku || null, categoria || null, estoque_minimo || 5);
    criado(res, { mensagem: 'Produto criado com sucesso', id: resultado.id });
  }),

  atualizar: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const produto = await Produto.buscarPorId(id);
    if (!produto) return naoEncontrado(res, 'Produto');
    const { nome, descricao, preco, estoque, sku, categoria, estoque_minimo } = req.body;
    if (!nome || !preco) return erro(res, 'Nome e preço são obrigatórios');
    if (preco < 0) return erro(res, 'Preço não pode ser negativo');
    const resultado = await Produto.atualizar(id, nome, descricao || '', preco, estoque || 0, sku || null, categoria || null, estoque_minimo || 5);
    if (resultado.changes === 0) return erro(res, 'Nenhum produto foi atualizado');
    ok(res, null, { mensagem: 'Produto atualizado com sucesso' });
  }),

  deletar: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const produto = await Produto.buscarPorId(id);
    if (!produto) return naoEncontrado(res, 'Produto');
    const resultado = await Produto.deletar(id);
    if (resultado.changes === 0) return erro(res, 'Nenhum produto foi deletado');
    ok(res, null, { mensagem: 'Produto deletado com sucesso' });
  }),

  decrementarEstoque: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { quantidade } = req.body;
    if (!quantidade || quantidade <= 0) return erro(res, 'Quantidade deve ser maior que zero');
    const produto = await Produto.buscarPorId(id);
    if (!produto) return naoEncontrado(res, 'Produto');
    if (produto.estoque < quantidade)
      return erro(res, `Estoque insuficiente. Disponível: ${produto.estoque}, Solicitado: ${quantidade}`);
    const resultado = await Produto.atualizarEstoque(id, quantidade);
    if (resultado.changes === 0) return erro(res, 'Nenhum produto foi atualizado');
    const produtoAtualizado = await Produto.buscarPorId(id);
    ok(res, null, { mensagem: 'Estoque decrementado com sucesso', estoque_anterior: produto.estoque, quantidade_removida: quantidade, estoque_novo: produtoAtualizado.estoque });
  }),

  incrementarEstoque: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { quantidade } = req.body;
    if (!quantidade || quantidade <= 0) return erro(res, 'Quantidade deve ser maior que zero');
    const produto = await Produto.buscarPorId(id);
    if (!produto) return naoEncontrado(res, 'Produto');
    const resultado = await Produto.incrementarEstoque(id, quantidade);
    if (resultado.changes === 0) return erro(res, 'Nenhum produto foi atualizado');
    const produtoAtualizado = await Produto.buscarPorId(id);
    ok(res, null, { mensagem: 'Estoque incrementado com sucesso', estoque_anterior: produto.estoque, quantidade_adicionada: quantidade, estoque_novo: produtoAtualizado.estoque });
  })
};
