function errorMiddleware(err, req, res, next) {
  const timestamp = new Date().toLocaleString('pt-BR');
  console.error(`[${timestamp}] ERRO ${req.method} ${req.path}: ${err.message}`);

  const status = err.status || 500;
  res.status(status).json({
    sucesso: false,
    mensagem: err.message || 'Erro interno do servidor',
    codigo: status
  });
}

module.exports = errorMiddleware;
