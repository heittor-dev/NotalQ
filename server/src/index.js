const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Importar conexão com banco de dados
const db = require('./config/database');

// Importar models para inicializar tabelas
const Produto = require('./models/Produto');
const Venda = require('./models/Venda');
const VendaItem = require('./models/VendaItem');
const Fornecedor = require('./models/Fornecedor');
const Compra = require('./models/Compra');
const CompraItem = require('./models/CompraItem');
const MovimentoFinanceiro = require('./models/MovimentoFinanceiro');
const Configuracao = require('./models/Configuracao');
const Usuario = require('./models/Usuario');

// Importar rotas
const rotasProdutos = require('./routes/produtos');
const rotasVendas = require('./routes/vendas');
const rotasPagamento = require('./routes/pagamento');
const rotasDashboard = require('./routes/dashboard');
const rotasFornecedores = require('./routes/fornecedores');
const rotasCompras = require('./routes/compras');
const rotasFinanceiro = require('./routes/financeiro');
const rotasRelatorios = require('./routes/relatorios');
const rotasConfiguracoes = require('./routes/configuracoes');
const rotasAuth = require('./routes/auth');

// Importar middleware de erros
const errorMiddleware = require('./middlewares/errorMiddleware');

// Criar app Express
const app = express();

// Segurança de headers
app.use(helmet());

// Configuração de middleware
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting: generoso para ambiente de desenvolvimento
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 1000,
  message: { sucesso: false, mensagem: 'Muitas requisições. Tente novamente em breve.' }
});
app.use(limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para log de requisições
app.use((req, res, next) => {
  const ts = new Date().toLocaleString('pt-BR');
  res.on('finish', () => {
    console.log(`[${ts}] ${req.method} ${req.path} → ${res.statusCode}`);
  });
  next();
});

// Inicializar tabelas do banco de dados
async function inicializarBancoDados() {
  try {
    // Aguardar database estar pronto
    let tentativas = 0;
    while (!db.isReady() && tentativas < 10) {
      console.log('Aguardando conexão com banco de dados...');
      await new Promise(resolve => setTimeout(resolve, 500));
      tentativas++;
    }
    
    if (!db.isReady()) {
      throw new Error('Database não inicializou em tempo hábil');
    }
    
    console.log('\n📊 Inicializando banco de dados...');
    
    await Produto.criarTabela();
    console.log('✓ Tabela de produtos criada/verificada');
    
    await Venda.criarTabela();
    console.log('✓ Tabela de vendas criada/verificada');
    
    await VendaItem.criarTabela();
    console.log('✓ Tabela de itens de venda criada/verificada');

    await Fornecedor.criarTabela();
    console.log('✓ Tabela de fornecedores criada/verificada');

    await Compra.criarTabela();
    console.log('✓ Tabela de compras criada/verificada');

    await CompraItem.criarTabela();
    console.log('✓ Tabela de itens de compra criada/verificada');

    await MovimentoFinanceiro.criarTabela();
    console.log('✓ Tabela de movimentos financeiros criada/verificada');

    await Configuracao.criarTabela();
    console.log('✓ Tabela de configurações criada/verificada');

    await Usuario.criarTabela();
    console.log('✓ Tabela de usuários criada/verificada');

    await popularProdutosIniciais();
    await criarUsuarioPadrao();

    console.log('✓ Banco de dados pronto!\n');
  } catch (err) {
    console.error('❌ Erro ao inicializar banco de dados:', err.message);
    throw err;
  }
}

async function popularProdutosIniciais() {
  try {
    const produtosExistentes = await Produto.listar();
    if (produtosExistentes.length > 0) {
      return;
    }

    const produtosPadrao = [
      {
        nome: 'Camiseta Premium',
        descricao: 'Camiseta estilosa com acabamento premium',
        preco: 79.9,
        estoque: 20,
        sku: 'CAM-PREM-001'
      },
      {
        nome: 'Mouse Gamer',
        descricao: 'Mouse RGB com sensor de alta precisão',
        preco: 149.9,
        estoque: 15,
        sku: 'MOU-GAM-002'
      },
      {
        nome: 'Caneca Personalizada',
        descricao: 'Caneca preta com logo minimalista',
        preco: 39.9,
        estoque: 30,
        sku: 'CAN-PER-003'
      }
    ];

    for (const produto of produtosPadrao) {
      await Produto.criar(produto.nome, produto.descricao, produto.preco, produto.estoque, produto.sku);
    }
    console.log('✓ Produtos iniciais adicionados ao banco de dados');
  } catch (err) {
    console.error('❌ Erro ao popular produtos iniciais:', err.message);
    throw err;
  }
}


async function criarUsuarioPadrao() {
  try {
    const total = await Usuario.contar();
    if (total > 0) return;
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('admin123', 10);
    await Usuario.criar('Admin', 'admin@pdv.com', hash);
    console.log('✓ Usuário padrão criado: admin@pdv.com / admin123');
  } catch (err) {
    console.error('Erro ao criar usuário padrão:', err.message);
  }
}

// Rota de saúde da API
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'API PDV funcionando',
    timestamp: new Date().toISOString(),
    database: 'SQLite',
    version: '1.0.0'
  });
});

// Rota raiz
app.get('/', (req, res) => {
  res.status(200).json({
    mensagem: 'Bem-vindo ao Backend PDV',
    version: '1.0.0',
    rotas: {
      saude: 'GET /health',
      produtos: 'GET /produtos',
      vendas: 'GET /vendas',
      dashboard: 'GET /dashboard'
    }
  });
});

// Usar rotas
app.use('/api/produtos', rotasProdutos);
app.use('/api/vendas', rotasVendas);
app.use('/api/pagamento', rotasPagamento);
app.use('/api/dashboard', rotasDashboard);
app.use('/api/fornecedores', rotasFornecedores);
app.use('/api/compras', rotasCompras);
app.use('/api/financeiro', rotasFinanceiro);
app.use('/api/relatorios', rotasRelatorios);
app.use('/api/configuracoes', rotasConfiguracoes);
app.use('/api/auth', rotasAuth);

// Tratamento de rota não encontrada
app.use((req, res) => {
  res.status(404).json({
    sucesso: false,
    mensagem: 'Rota não encontrada',
    path: req.path,
    metodo: req.method
  });
});

// Middleware global de erros
app.use(errorMiddleware);

// Configuração de porta
const PORT = process.env.PORT || 3001;

// Iniciar servidor
async function iniciarServidor() {
  try {
    // Inicializar conexão com banco de dados
    await db.inicializar();
    await inicializarBancoDados();

    // Ouvir porta
    app.listen(PORT, () => {
      console.log('✓ Servidor Express iniciado com sucesso!');
      console.log(`✓ Porta: ${PORT}`);
      console.log(`✓ URL: http://localhost:${PORT}`);
      console.log('\n📚 Rotas disponíveis:');
      console.log(`   GET  http://localhost:${PORT}/health`);
      console.log(`   GET  http://localhost:${PORT}/api/produtos`);
      console.log(`   POST http://localhost:${PORT}/api/produtos`);
      console.log(`   GET  http://localhost:${PORT}/api/vendas`);
      console.log(`   POST http://localhost:${PORT}/api/vendas`);
      console.log('\n🔗 CORS habilitado para todas as origens');
      console.log('\n⏹️  Pressione Ctrl+C para parar o servidor\n');
    });
  } catch (err) {
    console.error('❌ Erro ao iniciar servidor:', err.message);
    process.exit(1);
  }
}

// Iniciar aplicação
console.log('🚀 Iniciando aplicação PDV...');
iniciarServidor().catch(err => {
  console.error('❌ Erro fatal ao iniciar aplicação:', err.message);
  console.error('Stack:', err.stack);
  process.exit(1);
});

// Tratamento de interrupção
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Encerrando servidor...');
  db.close((err) => {
    if (err) {
      console.error('Erro ao fechar banco de dados:', err.message);
    } else {
      console.log('✓ Banco de dados fechado');
    }
    process.exit(0);
  });
});

module.exports = app;
