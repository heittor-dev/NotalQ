const ok = (res, dados, meta = {}) =>
  res.json({ sucesso: true, dados, ...meta })

const criado = (res, dados) =>
  res.status(201).json({ sucesso: true, ...dados })

const erro = (res, mensagem, status = 400) =>
  res.status(status).json({ sucesso: false, mensagem })

const naoEncontrado = (res, entidade) =>
  erro(res, `${entidade} não encontrado(a)`, 404)

module.exports = { ok, criado, erro, naoEncontrado }
