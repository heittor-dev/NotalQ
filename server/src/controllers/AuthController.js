const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const asyncHandler = require('../helpers/asyncHandler');
const { criado, erro } = require('../helpers/response');

const JWT_SECRET = process.env.JWT_SECRET || 'pdv-secret-2024';

module.exports = {
  registrar: asyncHandler(async (req, res) => {
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha) return erro(res, 'Nome, email e senha são obrigatórios');
    if (senha.length < 6) return erro(res, 'A senha deve ter no mínimo 6 caracteres');
    const existente = await Usuario.buscarPorEmail(email);
    if (existente) return erro(res, 'Este email já está cadastrado', 409);
    const senhaHash = await bcrypt.hash(senha, 10);
    const usuario = await Usuario.criar(nome, email, senhaHash);
    criado(res, { mensagem: 'Usuário cadastrado com sucesso', id: usuario.id });
  }),

  login: asyncHandler(async (req, res) => {
    const { email, senha } = req.body;
    if (!email || !senha) return erro(res, 'Email e senha são obrigatórios');
    const usuario = await Usuario.buscarPorEmail(email);
    if (!usuario) return erro(res, 'Email ou senha incorretos', 401);
    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaValida) return erro(res, 'Email ou senha incorretos', 401);
    const token = jwt.sign(
      { id: usuario.id, nome: usuario.nome, email: usuario.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ sucesso: true, token, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email } });
  })
};
