const Compra = require('../models/Compra');
const CompraItem = require('../models/CompraItem');
const Produto = require('../models/Produto');
const MovimentoFinanceiro = require('../models/MovimentoFinanceiro');
const { transaction } = require('../config/database');
const asyncHandler = require('../helpers/asyncHandler');
const { ok, criado, erro, naoEncontrado } = require('../helpers/response');

module.exports = {
  listar: asyncHandler(async (req, res) => {
    const dados = await Compra.listar();
    ok(res, dados, { total: dados.length });
  }),

  buscarPorId: asyncHandler(async (req, res) => {
    const compra = await Compra.buscarPorId(req.params.id);
    if (!compra) return naoEncontrado(res, 'Compra');
    const itens = await CompraItem.listarPorCompra(compra.id);
    ok(res, { ...compra, itens });
  }),

  criar: asyncHandler(async (req, res) => {
    const { fornecedor_id, itens, observacoes } = req.body;
    if (!itens || itens.length === 0) return erro(res, 'Informe ao menos um item');

    let valorTotal = 0;
    const itensValidados = [];
    for (const item of itens) {
      const { produto_id, quantidade, preco_unitario } = item;
      if (!produto_id || !quantidade || !preco_unitario)
        return erro(res, 'Cada item precisa de produto_id, quantidade e preco_unitario');
      const subtotal = quantidade * preco_unitario;
      valorTotal += subtotal;
      itensValidados.push({ produto_id, quantidade, preco_unitario, subtotal });
    }

    const compra = await Compra.criar({ fornecedor_id, data: new Date().toISOString(), valor_total: valorTotal, observacoes });
    for (const item of itensValidados) {
      await CompraItem.criar(compra.id, item.produto_id, item.quantidade, item.preco_unitario, item.subtotal);
    }
    criado(res, { mensagem: 'Compra registrada', id: compra.id, numero_pedido: compra.numero_pedido });
  }),

  receberCompra: asyncHandler(async (req, res) => {
    const compra = await Compra.buscarPorId(req.params.id);
    if (!compra) return naoEncontrado(res, 'Compra');
    if (compra.status === 'recebida') return erro(res, 'Compra já foi recebida');
    if (compra.status === 'cancelada') return erro(res, 'Compra cancelada não pode ser recebida');

    const itens = await CompraItem.listarPorCompra(compra.id);
    await transaction(async () => {
      for (const item of itens) {
        await Produto.incrementarEstoque(item.produto_id, item.quantidade);
      }
      await Compra.atualizarStatus(compra.id, 'recebida');
      await MovimentoFinanceiro.criar({
        tipo: 'despesa',
        categoria: 'compra',
        descricao: `Compra ${compra.numero_pedido}`,
        valor: compra.valor_total,
        data: new Date().toISOString().split('T')[0],
        referencia_id: compra.id,
        referencia_tipo: 'compra'
      });
    });

    ok(res, null, { mensagem: 'Compra recebida! Estoque e financeiro atualizados.' });
  }),

  cancelar: asyncHandler(async (req, res) => {
    const compra = await Compra.buscarPorId(req.params.id);
    if (!compra) return naoEncontrado(res, 'Compra');
    if (compra.status === 'recebida') return erro(res, 'Compra já recebida não pode ser cancelada');
    await Compra.atualizarStatus(compra.id, 'cancelada');
    ok(res, null, { mensagem: 'Compra cancelada' });
  })
};
