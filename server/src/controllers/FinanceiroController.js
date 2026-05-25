const MovimentoFinanceiro = require('../models/MovimentoFinanceiro');
const asyncHandler = require('../helpers/asyncHandler');
const { ok, criado, erro, naoEncontrado } = require('../helpers/response');

module.exports = {
  listar: asyncHandler(async (req, res) => {
    const { tipo, data_inicio, data_fim } = req.query;
    const dados = await MovimentoFinanceiro.listar({ tipo, data_inicio, data_fim });
    ok(res, dados, { total: dados.length });
  }),

  resumo: asyncHandler(async (req, res) => {
    const { data_inicio, data_fim } = req.query;
    const dados = await MovimentoFinanceiro.resumo({ data_inicio, data_fim });
    ok(res, dados);
  }),

  criar: asyncHandler(async (req, res) => {
    const { tipo, descricao, valor, data } = req.body;
    if (!tipo || !descricao || !valor || !data)
      return erro(res, 'tipo, descricao, valor e data são obrigatórios');
    if (!['receita', 'despesa'].includes(tipo))
      return erro(res, 'tipo deve ser receita ou despesa');
    const resultado = await MovimentoFinanceiro.criar(req.body);
    criado(res, { mensagem: 'Movimento registrado', id: resultado.id });
  }),

  deletar: asyncHandler(async (req, res) => {
    const resultado = await MovimentoFinanceiro.deletar(req.params.id);
    if (resultado.changes === 0) return naoEncontrado(res, 'Movimento');
    ok(res, null, { mensagem: 'Movimento removido' });
  })
};
