const sqlite3 = require('sqlite3')
const { open } = require('sqlite')
const path = require('path')

const dbPath = path.join(__dirname, 'database/pdv.db')

const PRODUTOS = [
  // Eletrônicos
  { nome: 'Mouse Sem Fio', descricao: 'Mouse wireless 2.4GHz', preco: 89.90, estoque: 40, estoque_minimo: 5, categoria: 'Eletrônicos', sku: 'EL-001' },
  { nome: 'Teclado Mecânico', descricao: 'Teclado mecânico switch azul', preco: 249.90, estoque: 20, estoque_minimo: 3, categoria: 'Eletrônicos', sku: 'EL-002' },
  { nome: 'Headset Gamer', descricao: 'Headset com microfone P2', preco: 179.90, estoque: 18, estoque_minimo: 3, categoria: 'Eletrônicos', sku: 'EL-003' },
  { nome: 'Webcam HD', descricao: 'Webcam 1080p USB', preco: 199.90, estoque: 12, estoque_minimo: 3, categoria: 'Eletrônicos', sku: 'EL-004' },
  { nome: 'Hub USB-C', descricao: 'Hub 7 portas USB-C', preco: 129.90, estoque: 25, estoque_minimo: 5, categoria: 'Eletrônicos', sku: 'EL-005' },
  { nome: 'Carregador Rápido', descricao: 'Carregador 65W GaN', preco: 149.90, estoque: 30, estoque_minimo: 5, categoria: 'Eletrônicos', sku: 'EL-006' },
  { nome: 'Cabo HDMI 2m', descricao: 'Cabo HDMI 4K 2 metros', preco: 39.90, estoque: 60, estoque_minimo: 10, categoria: 'Eletrônicos', sku: 'EL-007' },
  // Vestuário
  { nome: 'Camiseta Básica P', descricao: 'Camiseta 100% algodão P', preco: 49.90, estoque: 80, estoque_minimo: 10, categoria: 'Vestuário', sku: 'VS-001' },
  { nome: 'Camiseta Básica M', descricao: 'Camiseta 100% algodão M', preco: 49.90, estoque: 70, estoque_minimo: 10, categoria: 'Vestuário', sku: 'VS-002' },
  { nome: 'Camiseta Básica G', descricao: 'Camiseta 100% algodão G', preco: 49.90, estoque: 65, estoque_minimo: 10, categoria: 'Vestuário', sku: 'VS-003' },
  { nome: 'Moletom Canguru', descricao: 'Moletom com capuz e bolso', preco: 129.90, estoque: 35, estoque_minimo: 5, categoria: 'Vestuário', sku: 'VS-004' },
  { nome: 'Boné Snapback', descricao: 'Boné aba reta ajustável', preco: 59.90, estoque: 45, estoque_minimo: 8, categoria: 'Vestuário', sku: 'VS-005' },
  // Alimentos
  { nome: 'Café Especial 250g', descricao: 'Café gourmet moído 250g', preco: 32.90, estoque: 100, estoque_minimo: 15, categoria: 'Alimentos', sku: 'AL-001' },
  { nome: 'Whey Protein 1kg', descricao: 'Proteína concentrada baunilha', preco: 119.90, estoque: 28, estoque_minimo: 5, categoria: 'Alimentos', sku: 'AL-002' },
  { nome: 'Barra de Cereal cx12', descricao: 'Caixa 12 barras de cereal', preco: 28.90, estoque: 60, estoque_minimo: 10, categoria: 'Alimentos', sku: 'AL-003' },
  { nome: 'Granola Premium 400g', descricao: 'Granola com frutas secas', preco: 22.90, estoque: 50, estoque_minimo: 10, categoria: 'Alimentos', sku: 'AL-004' },
  // Escritório
  { nome: 'Suporte para Monitor', descricao: 'Suporte articulado até 27"', preco: 189.90, estoque: 15, estoque_minimo: 3, categoria: 'Escritório', sku: 'ES-001' },
  { nome: 'Mousepad XL', descricao: 'Mousepad 90x40cm', preco: 69.90, estoque: 38, estoque_minimo: 5, categoria: 'Escritório', sku: 'ES-002' },
  { nome: 'Luminária LED', descricao: 'Luminária de mesa LED 10W', preco: 89.90, estoque: 22, estoque_minimo: 4, categoria: 'Escritório', sku: 'ES-003' },
  { nome: 'Agenda 2025', descricao: 'Agenda planner capa dura', preco: 44.90, estoque: 55, estoque_minimo: 8, categoria: 'Escritório', sku: 'ES-004' },
  { nome: 'Caderno A4 100fls', descricao: 'Caderno espiral 100 folhas', preco: 19.90, estoque: 120, estoque_minimo: 20, categoria: 'Escritório', sku: 'ES-005' },
  { nome: 'Caneta Gel cx10', descricao: 'Caixa 10 canetas gel azul', preco: 24.90, estoque: 90, estoque_minimo: 15, categoria: 'Escritório', sku: 'ES-006' },
  // Cozinha
  { nome: 'Caneca Térmica 500ml', descricao: 'Caneca inox com tampa', preco: 79.90, estoque: 42, estoque_minimo: 7, categoria: 'Cozinha', sku: 'CZ-001' },
  { nome: 'Garrafa Squeeze 700ml', descricao: 'Squeeze plástico livre de BPA', preco: 34.90, estoque: 55, estoque_minimo: 8, categoria: 'Cozinha', sku: 'CZ-002' },
  { nome: 'Kit Temperos 6un', descricao: 'Kit 6 potes de temperos', preco: 49.90, estoque: 30, estoque_minimo: 5, categoria: 'Cozinha', sku: 'CZ-003' },
  // Higiene / Beleza
  { nome: 'Protetor Solar FPS50', descricao: 'Protetor solar 120ml FPS50', preco: 39.90, estoque: 70, estoque_minimo: 10, categoria: 'Higiene', sku: 'HG-001' },
  { nome: 'Shampoo 400ml', descricao: 'Shampoo nutritivo 400ml', preco: 29.90, estoque: 85, estoque_minimo: 12, categoria: 'Higiene', sku: 'HG-002' },
  // Games / Entretenimento
  { nome: 'Controle Bluetooth', descricao: 'Controle para PC/Android', preco: 159.90, estoque: 16, estoque_minimo: 3, categoria: 'Games', sku: 'GM-001' },
  { nome: 'Suporte Headset', descricao: 'Suporte de mesa para headset', preco: 49.90, estoque: 28, estoque_minimo: 5, categoria: 'Games', sku: 'GM-002' },
  // Acessórios
  { nome: 'Capa para Notebook', descricao: 'Capa neoprene 15.6"', preco: 54.90, estoque: 33, estoque_minimo: 5, categoria: 'Acessórios', sku: 'AC-001' },
]

const FORMAS = ['pix', 'credito', 'debito', 'dinheiro']

function diasAtras(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  const hora = Math.floor(Math.random() * 10) + 8
  const min = Math.floor(Math.random() * 60)
  d.setHours(hora, min, 0, 0)
  return d.toISOString()
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

async function seed() {
  const db = await open({ filename: dbPath, driver: sqlite3.Database })

  // ── Produtos: manter os existentes, inserir os novos ──────────────────────
  console.log('Inserindo produtos...')
  for (const p of PRODUTOS) {
    const existe = await db.get('SELECT id FROM produtos WHERE sku = ?', [p.sku])
    if (!existe) {
      await db.run(
        `INSERT INTO produtos (nome, descricao, preco, estoque, estoque_minimo, categoria, sku, criado_em)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [p.nome, p.descricao, p.preco, p.estoque, p.estoque_minimo, p.categoria, p.sku]
      )
    }
  }

  // ── Buscar todos os produtos disponíveis ──────────────────────────────────
  const todosProdutos = await db.all('SELECT id, nome, preco, estoque FROM produtos WHERE estoque > 0')
  console.log(`Total de produtos: ${todosProdutos.length}`)

  // ── Gerar 60 vendas nos últimos 60 dias ───────────────────────────────────
  console.log('Gerando vendas...')

  // Distribuição: mais vendas nos dias recentes
  const vendasPorDia = []
  for (let d = 60; d >= 1; d--) {
    // Entre 0 e 3 vendas por dia, mais frequentes perto de hoje
    const max = d <= 7 ? 3 : d <= 30 ? 2 : 1
    const qtdVendas = rand(0, max)
    for (let i = 0; i < qtdVendas; i++) {
      vendasPorDia.push(d)
    }
  }

  // Limitar a ~65 vendas
  const diasSelecionados = vendasPorDia.slice(0, 65)

  for (const diasAgo of diasSelecionados) {
    const data = diasAtras(diasAgo)
    const forma = pick(FORMAS)
    const desconto = Math.random() < 0.15 ? rand(5, 30) : 0

    // Escolher 1 a 4 produtos distintos para esta venda
    const nItens = rand(1, 4)
    const shuffled = [...todosProdutos].sort(() => Math.random() - 0.5).slice(0, nItens)

    const itens = shuffled.map(p => {
      const qtd = rand(1, Math.min(3, p.estoque > 0 ? p.estoque : 1))
      return { produto_id: p.id, quantidade: qtd, preco_unitario: p.preco, subtotal: qtd * p.preco }
    })

    const totalBruto = itens.reduce((s, i) => s + i.subtotal, 0)
    const valorTotal = Math.max(0, totalBruto - desconto)
    const qtdItens = itens.reduce((s, i) => s + i.quantidade, 0)

    // Número da venda
    const seq = await db.get("SELECT COALESCE(MAX(CAST(SUBSTR(numero_venda,5) AS INTEGER)),0)+1 AS n FROM vendas WHERE numero_venda LIKE 'VND-%'")
    const numero = `VND-${String(seq.n).padStart(4, '0')}`

    const res = await db.run(
      `INSERT INTO vendas (numero_venda, data, valor_total, quantidade_itens, desconto, forma_pagamento, status, criado_em)
       VALUES (?, ?, ?, ?, ?, ?, 'concluida', ?)`,
      [numero, data, valorTotal.toFixed(2), qtdItens, desconto, forma, data]
    )
    const vendaId = res.lastID

    for (const item of itens) {
      await db.run(
        `INSERT INTO venda_itens (venda_id, produto_id, quantidade, preco_unitario, subtotal, criado_em)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [vendaId, item.produto_id, item.quantidade, item.preco_unitario.toFixed(2), item.subtotal.toFixed(2), data]
      )
    }

    // Receita financeira
    await db.run(
      `INSERT INTO movimentos_financeiros (descricao, valor, tipo, categoria, data, forma_pagamento, referencia_id, referencia_tipo, criado_em)
       VALUES (?, ?, 'receita', 'Vendas', ?, ?, ?, 'venda', ?)`,
      [`Venda ${numero}`, valorTotal.toFixed(2), data.split('T')[0], forma, vendaId, data]
    )
  }

  const totalVendas = await db.get('SELECT COUNT(*) as n FROM vendas')
  const totalProdutos = await db.get('SELECT COUNT(*) as n FROM produtos')
  console.log(`\nPronto!`)
  console.log(`Produtos: ${totalProdutos.n}`)
  console.log(`Vendas: ${totalVendas.n}`)

  await db.close()
}

seed().catch(console.error)
