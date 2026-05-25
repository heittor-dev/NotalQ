const Configuracao = require('../models/Configuracao');
const asyncHandler = require('../helpers/asyncHandler');
const { ok, erro } = require('../helpers/response');

module.exports = {
  listar: asyncHandler(async (req, res) => {
    const dados = await Configuracao.listar();
    ok(res, dados);
  }),

  atualizar: asyncHandler(async (req, res) => {
    const { configs } = req.body;
    if (!configs || !Array.isArray(configs))
      return erro(res, 'Envie configs como array [{chave, valor}]');
    for (const { chave, valor } of configs) {
      if (chave) await Configuracao.atualizar(chave, valor ?? '');
    }
    ok(res, null, { mensagem: 'Configurações salvas' });
  })
};
