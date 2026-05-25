const Venda = require('../models/Venda');
const MovimentoFinanceiro = require('../models/MovimentoFinanceiro');
const asyncHandler = require('../helpers/asyncHandler');
const { ok, erro } = require('../helpers/response');

module.exports = {
  vendasPorPeriodo: asyncHandler(async (req, res) => {
    const { data_inicio, data_fim } = req.query;
    if (!data_inicio || !data_fim)
      return erro(res, 'Informe data_inicio e data_fim');
    const [vendas, totais] = await Promise.all([
      Venda.vendasPorPeriodo(data_inicio, data_fim),
      Venda.totaisPorPeriodo(data_inicio, data_fim)
    ]);
    ok(res, { vendas, totais });
  }),

  produtosMaisVendidos: asyncHandler(async (req, res) => {
    const limite = parseInt(req.query.limite) || 10;
    const produtos = await Venda.produtosMaisVendidos(limite);
    ok(res, produtos);
  }),

  faturamentoDiario: asyncHandler(async (req, res) => {
    const mes = req.query.mes || new Date().getMonth() + 1;
    const ano = req.query.ano || new Date().getFullYear();
    const dados = await Venda.faturamentoDiarioPorMes(
      String(mes).padStart(2, '0'),
      String(ano)
    );
    ok(res, dados);
  }),

  resumoFinanceiro: asyncHandler(async (req, res) => {
    const mes = req.query.mes || new Date().getMonth() + 1;
    const ano = req.query.ano || new Date().getFullYear();
    const mesStr = String(mes).padStart(2, '0');
    const anoStr = String(ano);
    const [receitas, despesas, ticketMedio] = await Promise.all([
      Venda.faturamentoMes(mesStr, anoStr),
      MovimentoFinanceiro.despesasMes(mesStr, anoStr),
      Venda.ticketMedio(mesStr, anoStr)
    ]);
    ok(res, {
      receitas,
      despesas,
      saldo: receitas - despesas,
      ticket_medio: ticketMedio,
      mes,
      ano
    });
  })
};
