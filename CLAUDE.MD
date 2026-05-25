# CLAUDE.md — PDV System

Guia para o Claude Code trabalhar com este projeto.

## O que é este projeto

Sistema de gestão empresarial acadêmico (PDV + SaaS). Módulos: Dashboard, Produtos, Simular Vendas, Histórico de Vendas, Financeiro, Fornecedores, Compras/Estoque, Relatórios, Configurações, Login/Cadastro.

## Como rodar

```bash
# Terminal 1 — Backend (porta 3001)
cd server && npm run dev

# Terminal 2 — Frontend (porta 3000, proxy → 3001)
cd client && npm run dev
```

Acesse: http://localhost:3000

## Estrutura

```
server/
├── src/
│   ├── config/database.js
│   ├── helpers/
│   │   ├── asyncHandler.js     # Wrapper try/catch para controllers
│   │   └── response.js         # Helpers: ok(), criado(), erro(), naoEncontrado()
│   ├── controllers/            # Auth, Dashboard, Pagamento, Produto, Venda,
│   │                           # Fornecedor, Compra, Financeiro, Relatorio, Configuracao
│   ├── middlewares/errorMiddleware.js
│   ├── models/                 # Usuario, Produto, Venda, VendaItem,
│   │                           # Fornecedor, Compra, CompraItem, MovimentoFinanceiro, Configuracao
│   ├── routes/                 # auth, dashboard, pagamento, produtos, vendas,
│   │                           # fornecedores, compras, financeiro, relatorios, configuracoes
│   └── index.js
└── database/pdv.db

client/
└── src/
    ├── App.jsx                 # Roteamento por estado + auth gate
    ├── index.css               # Design system (dark mode, variáveis CSS)
    ├── components/
    │   ├── CadastroProduto.jsx
    │   ├── SimuladorVendas.jsx # Interface de PDV (carrinho)
    │   ├── NavIcon.jsx         # Ícones SVG do menu lateral
    │   ├── Toast.jsx           # Notificações flutuantes + useToast()
    │   └── ui/
    │       └── KpiCard.jsx     # Card reutilizável para KPIs do Dashboard
    ├── pages/
    │   ├── Login.jsx, Cadastro.jsx
    │   ├── Dashboard.jsx, Pagamento.jsx, Cupom.jsx
    │   ├── Vendas.jsx, Financeiro.jsx, Fornecedores.jsx
    │   ├── Compras.jsx, Relatorios.jsx, Configuracoes.jsx
    └── services/api.js         # AuthService + ProdutoService + VendaService +
                                # PagamentoService + DashboardService + FornecedorService +
                                # CompraService + FinanceiroService + RelatorioService +
                                # ConfiguracaoService
```

## Diferenciais do Sistema

- **10 módulos integrados e funcionando:** Dashboard, Produtos, PDV, Pagamento, Cupom, Vendas, Fornecedores, Compras, Financeiro, Relatórios e Configurações — sistema completo do ponto de venda ao controle gerencial.
- **Transação atômica de pagamento:** `POST /api/pagamento` cria venda, itens, decrementa estoque e registra receita financeira em uma única operação com rollback automático em caso de falha.
- **Dashboard inteligente:** KPIs em tempo real, cálculo de crescimento percentual vs. mês anterior, alertas automáticos de estoque crítico, top 5 produtos e faturamento dos últimos 7 dias.
- **Financeiro automatizado:** toda venda aprovada gera receita e toda compra recebida gera despesa automaticamente — sem necessidade de entrada manual.
- **Segurança multicamada:** autenticação JWT + hash bcrypt (10 rounds) + headers HTTP seguros via Helmet + rate limiting de 1.000 req/min.
- **Integridade de dados:** soft delete em fornecedores preserva histórico de compras; transações SQL com rollback protegem o estoque.
- **Design system próprio:** modo claro/escuro nativo, variáveis CSS globais, componentes reutilizáveis (KpiCard, Toast, NavIcon) sem dependência de frameworks externos.
- **4 relatórios analíticos** com filtros flexíveis por período, mês e ano: vendas, produtos mais vendidos, faturamento diário e resumo financeiro.
- **30+ endpoints REST** organizados em 10 grupos, cobrindo toda a operação do negócio.

## Regras de negócio

- `POST /api/pagamento` cria a venda E processa o pagamento em uma só chamada (transação única).
- Pagamento simula processamento com delay de 1.5s antes de confirmar.
- Formas de pagamento aceitas: `pix`, `credito`, `debito`, `dinheiro`.
- Estoque é decrementado automaticamente no pagamento; incrementado ao receber compra.
- `estoque_minimo` (padrão: 5) define o limiar de alerta no dashboard.
- Toda venda aprovada cria automaticamente um movimento financeiro (receita).
- Toda compra recebida cria automaticamente um movimento financeiro (despesa).
- Soft delete em fornecedores: campo `ativo = 0` — não remove do banco.
- Fluxo de compra: `pendente` → `receber` (incrementa estoque + registra despesa) → `recebida`.
- Apenas compras com status `pendente` podem ser canceladas.
- Número de venda: `NV-{timestamp}-{random}` / Número de pedido de compra: `CP-{timestamp}-{random}`.
- Relatórios aceitam filtros: `data_inicio`, `data_fim`, `mes`, `ano`, `limite`.
- JWT expira em 7 dias; chave configurada via variável de ambiente `JWT_SECRET`.
- Frontend usa CSS puro com variáveis — não adicionar Tailwind.
- Porta frontend: **3000** (proxy para backend em **3001**).

## Checklist do Projeto

### Semana 1 (04/05 → 10/05) — Setup + cadastro de produtos
- [x] Ana: backlog completo + MVP + User Stories
- [x] Camilly: cronograma + Trello + divisão de tarefas
- [x] Heittor: setup backend (Node.js/Express)
- [x] Pedro: setup frontend (React/Vite)
- [ ] Otávio: documentação inicial
- [x] Heittor: SQLite + tabela de produtos
- [x] Pedro: layout base + tela de cadastro de produtos
- [x] Heittor: API de produtos (GET/POST)
- [x] Pedro: integração frontend ↔ API
- [x] Heittor + Pedro: testar cadastro (fechar semana)

### Semana 2 (11/05 → 17/05) — Vendas (PDV) + pagamento
- [x] Heittor: estrutura de vendas (backend)
- [x] Pedro: tela de PDV
- [x] Ana: validar fluxo de venda
- [x] Heittor: lógica de venda (itens + total)
- [x] Pedro: adicionar produtos na venda (UI)
- [x] Heittor + Pedro: testar cálculos
- [x] Heittor: rota de pagamento
- [x] Pedro: botão/fluxo de pagar
- [x] Heittor + Pedro: testar fluxo completo venda → pagamento
- [ ] Otávio: atualizar documentação

### Semana 3 (18/05 → 24/05) — Cupom + dashboard + testes + finalização
- [x] Heittor: cupom (backend)
- [x] Pedro: tela do cupom
- [x] Heittor + Pedro: testar cupom
- [x] Heittor: dashboard (backend)
- [x] Pedro: dashboard (frontend)
- [x] Ana: validar dados do dashboard
- [x] Heittor + Pedro: testar sistema completo
- [x] Ana: validar MVP
- [ ] Otávio: finalizar documentação + slides
- [ ] Todos: ensaio da apresentação (24/05)

### Entrega Final (25/05)
- [ ] Apresentar: cadastro de produtos
- [ ] Apresentar: venda (PDV / Simular Vendas)
- [ ] Apresentar: pagamento
- [ ] Apresentar: cupom
- [ ] Apresentar: dashboard
- [ ] Apresentar: login/cadastro de usuário

## Git

Nunca fazer push direto em `main`. Sempre:
1. `git checkout -b feat/...` ou `fix/...`
2. Commit
3. `git push -u origin <branch>`
4. `gh pr create`
