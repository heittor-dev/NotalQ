const Venda = require('../models/Venda');
const VendaItem = require('../models/VendaItem');
const Produto = require('../models/Produto');
const MovimentoFinanceiro = require('../models/MovimentoFinanceiro');
const { transaction } = require('../config/database');
const asyncHandler = require('../helpers/asyncHandler');
const { erro, naoEncontrado } = require('../helpers/response');

const FORMAS_VALIDAS = ['pix', 'credito', 'debito', 'dinheiro'];

module.exports = {
  processar: asyncHandler(async (req, res) => {
    const { itens, desconto = 0, forma_pagamento, observacoes = '' } = req.body;

    if (!forma_pagamento || !FORMAS_VALIDAS.includes(forma_pagamento.toLowerCase()))
      return erro(res, `Forma de pagamento inválida. Use: ${FORMAS_VALIDAS.join(', ')}`);
    if (!itens || itens.length === 0)
      return erro(res, 'A venda deve conter pelo menos um item');

    let valorTotal = 0;
    let quantidadeItens = 0;
    const itensValidados = [];

    for (const item of itens) {
      const { produto_id, quantidade } = item;
      if (!produto_id || !quantidade || quantidade <= 0)
        return erro(res, 'Cada item deve ter produto_id e quantidade válidos');
      const produto = await Produto.buscarPorId(produto_id);
      if (!produto) return naoEncontrado(res, `Produto ${produto_id}`);
      if (produto.estoque < quantidade)
        return erro(res, `Estoque insuficiente para ${produto.nome}`);
      const subtotal = produto.preco * quantidade;
      valorTotal += subtotal;
      quantidadeItens += quantidade;
      itensValidados.push({ produto_id, nome: produto.nome, quantidade, preco_unitario: produto.preco, subtotal });
    }

    valorTotal = Math.max(0, valorTotal - desconto);

    await new Promise(resolve => setTimeout(resolve, 1500));

    const numeroVenda = Venda.gerarNumeroVenda();
    const dataVenda = new Date().toISOString();

    let vendaCriada;
    await transaction(async () => {
      vendaCriada = await Venda.criar({
        numero_venda: numeroVenda,
        data: dataVenda,
        valor_total: valorTotal,
        quantidade_itens: quantidadeItens,
        desconto,
        observacoes,
        forma_pagamento: forma_pagamento.toLowerCase(),
        status: 'finalizada'
      });

      for (const item of itensValidados) {
        await VendaItem.criar(vendaCriada.id, item.produto_id, item.quantidade, item.preco_unitario, item.subtotal);
        await Produto.atualizarEstoque(item.produto_id, item.quantidade);
      }

      await MovimentoFinanceiro.criar({
        tipo: 'receita',
        categoria: 'venda',
        descricao: `Venda ${numeroVenda}`,
        valor: valorTotal,
        data: dataVenda.split('T')[0],
        forma_pagamento: forma_pagamento.toLowerCase(),
        referencia_id: vendaCriada.id,
        referencia_tipo: 'venda'
      });
    });

    const codigoAutorizacao = `AUTH-${Date.now().toString(36).toUpperCase()}`;
    const timestamp = new Date().toLocaleString('pt-BR');
    const formasLabel = { pix: 'PIX', credito: 'Crédito', debito: 'Débito', dinheiro: 'Dinheiro' };

    const cupom_data = {
      numero_venda: numeroVenda,
      venda_id: vendaCriada.id,
      data_hora: timestamp,
      itens: itensValidados,
      subtotal_bruto: itensValidados.reduce((s, i) => s + i.subtotal, 0),
      desconto,
      valor_total: valorTotal,
      forma_pagamento: formasLabel[forma_pagamento.toLowerCase()] || forma_pagamento,
      codigo_autorizacao: codigoAutorizacao
    };

    console.log(`[${timestamp}] Venda ${numeroVenda} — R$ ${valorTotal.toFixed(2)} — ${forma_pagamento} — Auth: ${codigoAutorizacao}`);

    res.status(200).json({ sucesso: true, aprovado: true, codigo_autorizacao: codigoAutorizacao, mensagem: 'Pagamento aprovado com sucesso!', cupom_data });
  })
};
