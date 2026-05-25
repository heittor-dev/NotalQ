const Venda = require('../models/Venda');
const Produto = require('../models/Produto');
const MovimentoFinanceiro = require('../models/MovimentoFinanceiro');
const Compra = require('../models/Compra');
const asyncHandler = require('../helpers/asyncHandler');
const { ok } = require('../helpers/response');

module.exports = {
  obterEstatisticas: asyncHandler(async (req, res) => {
    const hoje = new Date().toISOString().split('T')[0];
    const agora = new Date();
    const mesStr = String(agora.getMonth() + 1).padStart(2, '0');
    const anoStr = String(agora.getFullYear());

    const dataAnterior = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
    const mesAnteriorStr = String(dataAnterior.getMonth() + 1).padStart(2, '0');
    const anoAnteriorStr = String(dataAnterior.getFullYear());

    const [
      totalVendas, faturamentoDia, totalProdutos, semEstoque, estoquesBaixos,
      porFormaPagamento, ultimasVendas, totaisFinanceiros
    ] = await Promise.all([
      Venda.contarTotal(),
      Venda.faturamentoDia(hoje),
      Produto.contarTotal(),
      Produto.semEstoque(),
      Produto.estoquesBaixos(),
      Venda.porFormaPagamento(),
      Venda.ultimas(7),
      MovimentoFinanceiro.totaisAcumulados()
    ]);

    const [
      alertas, receitasMes, despesasMes, comprasPendentes,
      faturamento7dias, topProdutos, ticketMedio, faturamentoAnterior
    ] = await Promise.all([
      Produto.alertas(10),
      Venda.faturamentoMes(mesStr, anoStr),
      MovimentoFinanceiro.despesasMes(mesStr, anoStr),
      Compra.contarPendentes(),
      Venda.faturamento7dias(),
      Venda.topProdutos(mesStr, anoStr),
      Venda.ticketMedio(mesStr, anoStr),
      Venda.faturamentoMes(mesAnteriorStr, anoAnteriorStr)
    ]);

    const crescimento = faturamentoAnterior > 0
      ? ((receitasMes - faturamentoAnterior) / faturamentoAnterior) * 100
      : null;

    ok(res, {
      total_vendas: totalVendas,
      faturamento_dia: faturamentoDia.faturamento,
      vendas_hoje: faturamentoDia.quantidade,
      total_produtos: totalProdutos,
      produtos_sem_estoque: semEstoque,
      produtos_estoque_baixo: estoquesBaixos,
      vendas_por_pagamento: porFormaPagamento,
      ultimas_vendas: ultimasVendas,
      alertas_estoque: alertas,
      saldo_mes: receitasMes - despesasMes,
      receitas_mes: receitasMes,
      despesas_mes: despesasMes,
      receitas_total: totaisFinanceiros.receitas_total,
      despesas_total: totaisFinanceiros.despesas_total,
      saldo_total: totaisFinanceiros.receitas_total - totaisFinanceiros.despesas_total,
      compras_pendentes: comprasPendentes,
      faturamento_7dias: faturamento7dias,
      top_produtos: topProdutos,
      ticket_medio: ticketMedio,
      faturamento_mes_anterior: faturamentoAnterior,
      crescimento_percentual: crescimento
    });
  })
};
