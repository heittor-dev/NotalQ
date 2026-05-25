const Fornecedor = require('../models/Fornecedor');
const asyncHandler = require('../helpers/asyncHandler');
const { ok, criado, erro, naoEncontrado } = require('../helpers/response');

module.exports = {
  listar: asyncHandler(async (req, res) => {
    const dados = await Fornecedor.listar();
    ok(res, dados, { total: dados.length });
  }),

  buscarPorId: asyncHandler(async (req, res) => {
    const f = await Fornecedor.buscarPorId(req.params.id);
    if (!f) return naoEncontrado(res, 'Fornecedor');
    ok(res, f);
  }),

  criar: asyncHandler(async (req, res) => {
    const { nome } = req.body;
    if (!nome) return erro(res, 'Nome é obrigatório');
    const resultado = await Fornecedor.criar(req.body);
    criado(res, { mensagem: 'Fornecedor cadastrado', id: resultado.id });
  }),

  atualizar: asyncHandler(async (req, res) => {
    const f = await Fornecedor.buscarPorId(req.params.id);
    if (!f) return naoEncontrado(res, 'Fornecedor');
    if (!req.body.nome) return erro(res, 'Nome é obrigatório');
    await Fornecedor.atualizar(req.params.id, req.body);
    ok(res, null, { mensagem: 'Fornecedor atualizado' });
  }),

  deletar: asyncHandler(async (req, res) => {
    const f = await Fornecedor.buscarPorId(req.params.id);
    if (!f) return naoEncontrado(res, 'Fornecedor');
    await Fornecedor.deletar(req.params.id);
    ok(res, null, { mensagem: 'Fornecedor desativado' });
  })
};
