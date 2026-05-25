# SISGEV — Sistema de Gestão de Vendas

## Visão Geral

Sistema de Gestão de Vendas acadêmico com aparência e funcionamento empresarial.

**Stack:** React + Vite (frontend) · Node.js + Express + SQLite (backend)

---

## Matriz QFD — Análise de Requisitos

### Requisitos dos Clientes ("Quês")

| Requisito | Importância |
|---|---|
| Melhor organização das informações | 5 |
| Automatização do controle de vendas | 5 |
| Facilidade de uso da ferramenta | 4 |
| Controle preciso de cartões/maquininha | 4 |
| Redução de tempo em etapas manuais | 3 |
| Baixo investimento/custo acessível | 3 |

### Características Técnicas ("Comos")

- Interface UI/UX intuitiva
- Módulo de conciliação automática
- API de integração com adquirentes de cartão
- Banco de dados em nuvem (Cloud)
- Dashboard de relatórios financeiros
- Protocolos de segurança e criptografia
- Arquitetura de baixo custo (SaaS)

### Relações (Requisito × Característica Técnica)

| Requisito | Forte | Moderada |
|---|---|---|
| Organização das informações | UI/UX, Segurança | — |
| Automatização de vendas | Conciliação automática, API adquirentes, Banco em nuvem | UI/UX |
| Facilidade de uso | UI/UX | Banco em nuvem, Arquitetura SaaS |
| Controle de cartões/maquininha | Conciliação automática, API adquirentes | Banco em nuvem, Segurança |
| Redução de tempo manual | UI/UX, Conciliação, API, Dashboard, Arquitetura SaaS | — |
| Baixo custo | Banco em nuvem, Arquitetura SaaS | — |

### Importância Absoluta (resultado da matriz)

| # | Característica Técnica | Importância Absoluta |
|---|---|---|
| 1 | Módulo de conciliação automática | 120 |
| 2 | API de integração com adquirentes de cartão | 104 |
| 3 | Banco de dados em nuvem (Cloud) | 66 |
| 4 | Interface UI/UX intuitiva | 65 |

### Conclusão

O sistema foi desenvolvido atendendo diretamente os requisitos de maior importância identificados na matriz. A automação da conciliação financeira e a integração com formas de pagamento — os dois itens de maior importância absoluta — foram implementados com sucesso: toda venda processa o pagamento e registra a movimentação financeira automaticamente, sem intervenção manual.

---

## Fluxo Principal

### Venda
```
[Dashboard] ←──────────────────────────────────────────────┐
                                                             │ atualiza KPIs
[Produtos] → Cadastrar / Editar / Excluir                   │
                                                             │
[PDV] → Montar carrinho → "Ir para Pagamento"               │
          ↓                                                  │
[Pagamento] → Selecionar método → Simular aprovação (1.5s)  │
          ↓                                                  │
[Cupom] → Visualizar → "Nova Venda" ────────────────────────┘
```

### Compra
```
[Compras] → Criar pedido (fornecedor + produtos) → status: pendente
                ↓
          → Receber compra → incrementa estoque + registra despesa → status: recebida
          → Cancelar (só se pendente) → status: cancelada
```

---

## Status das Funcionalidades

### Backend (Node.js / Express / SQLite)

| Funcionalidade | Status |
|---|---|
| Auth: registro + login JWT | ✅ Completo |
| CRUD Produtos + estoque_minimo + categoria | ✅ Completo |
| Alertas de estoque baixo | ✅ Completo |
| CRUD Vendas com itens | ✅ Completo |
| POST /api/pagamento (transação completa) | ✅ Completo |
| GET /api/dashboard (KPIs completos) | ✅ Completo |
| CRUD Fornecedores (soft delete) | ✅ Completo |
| CRUD Compras + receber + cancelar | ✅ Completo |
| GET/POST /api/financeiro (movimentos) | ✅ Completo |
| GET /api/relatorios (4 relatórios) | ✅ Completo |
| GET/PUT /api/configuracoes | ✅ Completo |
| Middleware de erros global | ✅ Completo |
| Helmet (segurança de headers) | ✅ Completo |
| Rate limiting (1000 req/min) | ✅ Completo |
| Helpers asyncHandler + response | ✅ Completo |

### Frontend (React + Vite + CSS Puro)

| Funcionalidade | Status |
|---|---|
| Login + Cadastro de usuário | ✅ Completo |
| Dashboard com KPIs, gráficos e alertas | ✅ Completo |
| CRUD Produtos com status visual de estoque | ✅ Completo |
| PDV (SimuladorVendas) com carrinho | ✅ Completo |
| Tela de Pagamento (4 formas) | ✅ Completo |
| Cupom de venda | ✅ Completo |
| Histórico de Vendas com filtros | ✅ Completo |
| CRUD Fornecedores | ✅ Completo |
| Compras: criar, receber, cancelar | ✅ Completo |
| Financeiro: movimentos + resumo | ✅ Completo |
| Relatórios: período, top produtos, faturamento | ✅ Completo |
| Configurações da empresa | ✅ Completo |
| Toasts de notificação | ✅ Completo |
| Modo claro/escuro | ✅ Completo |
| KpiCard como componente reutilizável | ✅ Completo |

---

## Diferenciais e Pontos Fortes

### Produto
- **Sistema completo:** 10 módulos integrados e funcionando — do PDV ao controle gerencial
- **30+ endpoints REST** organizados em 10 grupos cobrindo toda a operação do negócio
- **9 tabelas** com relacionamentos e integridade referencial no banco de dados
- **15 funcionalidades** de frontend totalmente implementadas e testadas

### Arquitetura
- **Transação atômica de pagamento:** criar venda + itens + decrementar estoque + registrar receita em uma única operação com rollback automático
- **Financeiro automatizado:** venda aprovada → receita criada; compra recebida → despesa criada, sem entrada manual
- **Separação clara MVC:** controllers, models e routes bem definidos com helpers de resposta padronizados
- **Integridade de dados:** soft delete preserva histórico; transações SQL protegem consistência do estoque

### Segurança
- **JWT + bcrypt (10 rounds):** autenticação segura com hash de senha e tokens com expiração
- **Helmet:** headers HTTP de segurança aplicados em todas as respostas
- **Rate limiting:** 1.000 requisições por minuto por IP, protegendo contra abuso

### Experiência
- **Dashboard inteligente:** KPIs em tempo real, crescimento % vs. mês anterior, alertas de estoque, top produtos e gráfico de faturamento dos últimos 7 dias
- **Modo claro/escuro** nativo sem dependência de framework externo
- **Design system CSS** próprio com variáveis globais e componentes reutilizáveis (KpiCard, Toast, NavIcon)
- **4 relatórios analíticos** com filtros flexíveis por período, mês e ano

---

## Rotas da API

### Auth
| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/registro` | Registrar novo usuário |
| POST | `/api/auth/login` | Login → retorna JWT (7 dias) |

### Produtos
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/produtos` | Listar todos os produtos |
| GET | `/api/produtos/alertas/estoque-baixo` | Produtos abaixo do estoque_minimo |
| GET | `/api/produtos/:id` | Buscar produto por ID |
| POST | `/api/produtos` | Criar produto |
| PUT | `/api/produtos/:id` | Atualizar produto |
| PUT | `/api/produtos/:id/estoque/decrementar` | Decrementar estoque |
| PUT | `/api/produtos/:id/estoque/incrementar` | Incrementar estoque |
| DELETE | `/api/produtos/:id` | Deletar produto |

### Vendas
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/vendas` | Listar todas as vendas |
| GET | `/api/vendas/:id` | Venda com itens |
| POST | `/api/vendas` | Criar venda simples |
| PUT | `/api/vendas/:id` | Atualizar venda |
| DELETE | `/api/vendas/:id` | Deletar venda |

### Pagamento
| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/pagamento` | Processar venda + pagamento + movimento financeiro |

### Dashboard
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/dashboard` | Estatísticas gerais (KPIs, alertas, gráficos) |

### Financeiro
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/financeiro` | Listar movimentos (filtros: tipo, data_inicio, data_fim) |
| GET | `/api/financeiro/resumo` | Resumo do período (receitas, despesas, saldo) |
| POST | `/api/financeiro` | Criar movimento manual |
| DELETE | `/api/financeiro/:id` | Deletar movimento |

### Fornecedores
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/fornecedores` | Listar todos (ativos) |
| GET | `/api/fornecedores/:id` | Buscar por ID |
| POST | `/api/fornecedores` | Criar fornecedor |
| PUT | `/api/fornecedores/:id` | Atualizar fornecedor |
| DELETE | `/api/fornecedores/:id` | Desativar (soft delete: ativo=0) |

### Compras
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/compras` | Listar todas as compras |
| GET | `/api/compras/:id` | Compra com itens |
| POST | `/api/compras` | Criar compra (status: pendente) |
| PUT | `/api/compras/:id/receber` | Receber: incrementa estoque + registra despesa |
| PUT | `/api/compras/:id/cancelar` | Cancelar (só pendentes) |

### Relatórios
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/relatorios/vendas` | Vendas por período (data_inicio, data_fim) |
| GET | `/api/relatorios/produtos-mais-vendidos` | Top produtos (limite=10) |
| GET | `/api/relatorios/faturamento-diario` | Faturamento diário do mês (mes, ano) |
| GET | `/api/relatorios/financeiro` | Resumo financeiro mensal (mes, ano) |

### Configurações
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/configuracoes` | Listar todas as configs como objeto |
| PUT | `/api/configuracoes` | Atualizar configs (array de {chave, valor}) |

---

## Banco de Dados

```sql
usuarios (id, nome, email UNIQUE, senha_hash, criado_em)

produtos (id, nome, descricao, preco, estoque, estoque_minimo DEFAULT 5,
          categoria, sku, criado_em)

vendas (id, numero_venda UNIQUE, data, valor_total, quantidade_itens,
        desconto, observacoes, forma_pagamento, status, criado_em)
  -- forma_pagamento: pix | credito | debito | dinheiro
  -- status: finalizada | pendente | cancelada

venda_itens (id, venda_id→vendas, produto_id→produtos,
             quantidade, preco_unitario, subtotal, criado_em)

fornecedores (id, nome, cnpj, email, telefone, endereco,
              categoria, ativo DEFAULT 1, criado_em)

compras (id, fornecedor_id→fornecedores, numero_pedido, data,
         valor_total, status, observacoes, criado_em)
  -- status: pendente | recebida | cancelada

compra_itens (id, compra_id→compras, produto_id→produtos,
              quantidade, preco_unitario, subtotal)

movimentos_financeiros (id, tipo, categoria, descricao, valor, data,
                        forma_pagamento, referencia_id, referencia_tipo, criado_em)
  -- tipo: receita | despesa
  -- referencia_tipo: venda | compra

configuracoes (id, chave UNIQUE, valor, atualizado_em)
  -- chaves padrão: nome_empresa, cnpj, telefone, endereco, moeda (BRL)
```

---

## Navegação (App.jsx)

| Seção | Páginas |
|---|---|
| VISÃO GERAL | Dashboard |
| OPERAÇÕES | Simular Vendas (PDV), Vendas |
| CADASTROS | Produtos, Fornecedores |
| GESTÃO | Compras/Estoque, Financeiro |
| ANÁLISE | Relatórios |
| SISTEMA | Configurações |

---

## Como Rodar

```bash
# Terminal 1 — Backend (porta 3001)
cd server && npm run dev

# Terminal 2 — Frontend (porta 3000, proxy → 3001)
cd client && npm run dev
```

Acesse: http://localhost:3000  
Usuário padrão: `admin@sisgev.com` / `admin123`

---

## Responsabilidades

| Pessoa | Área |
|---|---|
| Heittor | Backend: API, banco, regras de negócio, pagamento, estoque, QA |
| Pedro | Frontend: UI/UX, integração API, dashboard, QA |
| Ana | Backlog, validação de fluxos, user stories, QA funcional |
| Camilly | Cronograma, Trello, organização da equipe |
| Otávio | Documentação, slides de apresentação |
