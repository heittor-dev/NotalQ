const Venda = require('../models/Venda');
const VendaItem = require('../models/VendaItem');
const Produto = require('../models/Produto');
const asyncHandler = require('../helpers/asyncHandler');
const { ok, criado, erro, naoEncontrado } = require('../helpers/response');

module.exports = {
  listar: asyncHandler(async (req, res) => {
    const vendas = await Venda.listar();
    ok(res, vendas, { total: vendas.length });
  }),

  buscarPorId: asyncHandler(async (req, res) => {
    const venda = await Venda.buscarPorId(req.params.id);
    if (!venda) return naoEncontrado(res, 'Venda');
    const itens = await VendaItem.listarPorVenda(req.params.id);
    ok(res, { ...venda, itens });
  }),

  criar: asyncHandler(async (req, res) => {
    const { itens, desconto = 0, formaPagamento = 'dinheiro', observacoes = '' } = req.body;
    if (!itens || itens.length === 0) return erro(res, 'A venda deve conter pelo menos um item');

    let valorTotal = 0;
    let quantidadeItens = 0;
    const itensValidados = [];

    for (const item of itens) {
      const { produto_id, quantidade } = item;
      if (!produto_id || !quantidade || quantidade <= 0)
        return erro(res, 'Cada item deve ter produto_id e quantidade válidos');
      const produto = await Produto.buscarPorId(produto_id);
      if (!produto) return naoEncontrado(res, `Produto ${produto_id}`);
      if (produto.estoque < quantidade) return erro(res, `Estoque insuficiente do produto ${produto.nome}`);
      const subtotal = produto.preco * quantidade;
      valorTotal += subtotal;
      quantidadeItens += quantidade;
      itensValidados.push({ produto_id, quantidade, preco_unitario: produto.preco, subtotal });
    }

    valorTotal = Math.max(0, valorTotal - desconto);
    const numeroVenda = Venda.gerarNumeroVenda();
    const vendaCriada = await Venda.criar({
      numero_venda: numeroVenda,
      data: new Date().toISOString(),
      valor_total: valorTotal,
      quantidade_itens: quantidadeItens,
      desconto,
      observacoes,
      forma_pagamento: formaPagamento,
      status: 'finalizada'
    });

    for (const item of itensValidados) {
      await VendaItem.criar(vendaCriada.id, item.produto_id, item.quantidade, item.preco_unitario, item.subtotal);
      await Produto.atualizarEstoque(item.produto_id, item.quantidade);
    }

    criado(res, { mensagem: 'Venda criada com sucesso', id: vendaCriada.id, numero_venda: numeroVenda, valor_total: valorTotal });
  }),

  atualizar: asyncHandler(async (req, res) => {
    const venda = await Venda.buscarPorId(req.params.id);
    if (!venda) return naoEncontrado(res, 'Venda');
    const { valor_total, desconto, forma_pagamento } = req.body;
    const resultado = await Venda.atualizar(req.params.id, {
      data: venda.data,
      valor_total: valor_total ?? venda.valor_total,
      quantidade_itens: venda.quantidade_itens,
      desconto: desconto ?? venda.desconto,
      observacoes: venda.observacoes,
      forma_pagamento: forma_pagamento || venda.forma_pagamento,
      status: venda.status
    });
    if (resultado.changes === 0) return erro(res, 'Nenhuma venda foi atualizada');
    ok(res, null, { mensagem: 'Venda atualizada com sucesso' });
  }),

  deletar: asyncHandler(async (req, res) => {
    const venda = await Venda.buscarPorId(req.params.id);
    if (!venda) return naoEncontrado(res, 'Venda');
    await VendaItem.deletarPorVenda(req.params.id);
    const resultado = await Venda.deletar(req.params.id);
    if (resultado.changes === 0) return erro(res, 'Nenhuma venda foi deletada');
    ok(res, null, { mensagem: 'Venda deletada com sucesso' });
  })
};
