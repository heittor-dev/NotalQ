const sqlite3 = require('sqlite3')
const { open } = require('sqlite')
const path = require('path')

const dbPath = path.join(__dirname, 'database/pdv.db')

const NOVOS_PRODUTOS = [
  { nome: 'Monitor 24" Full HD',    descricao: 'Monitor 1080p 75Hz HDMI',          preco: 899.90,  estoque: 10, estoque_minimo: 2, categoria: 'Eletrônicos', sku: 'EL-010' },
  { nome: 'SSD 480GB',              descricao: 'SSD SATA III 480GB',                preco: 319.90,  estoque: 15, estoque_minimo: 3, categoria: 'Eletrônicos', sku: 'EL-011' },
  { nome: 'Memória RAM 8GB DDR4',   descricao: 'RAM DDR4 2666MHz',                  preco: 199.90,  estoque: 20, estoque_minimo: 4, categoria: 'Eletrônicos', sku: 'EL-012' },
  { nome: 'Roteador Wi-Fi 6',       descricao: 'Roteador dual-band AX1500',         preco: 449.90,  estoque: 8,  estoque_minimo: 2, categoria: 'Eletrônicos', sku: 'EL-013' },
  { nome: 'Smartwatch Fit',         descricao: 'Smartwatch IP68 1.4" BT',           preco: 349.90,  estoque: 12, estoque_minimo: 2, categoria: 'Eletrônicos', sku: 'EL-014' },
  { nome: 'Fone Bluetooth ANC',     descricao: 'Over-ear cancelamento de ruído',    preco: 599.90,  estoque: 9,  estoque_minimo: 2, categoria: 'Eletrônicos', sku: 'EL-015' },
  { nome: 'Power Bank 20000mAh',    descricao: 'Carregador portátil USB-C 20W',     preco: 189.90,  estoque: 25, estoque_minimo: 5, categoria: 'Eletrônicos', sku: 'EL-016' },
  { nome: 'Cadeira Gamer',          descricao: 'Ergonômica apoio lombar ajustável', preco: 1299.90, estoque: 5,  estoque_minimo: 1, categoria: 'Escritório',  sku: 'ES-010' },
  { nome: 'Mesa Gamer 120x60',      descricao: 'Mesa com passa-fio embutido',       preco: 649.90,  estoque: 6,  estoque_minimo: 1, categoria: 'Escritório',  sku: 'ES-011' },
  { nome: 'Notebook Stand',         descricao: 'Suporte ergonômico alumínio',       preco: 149.90,  estoque: 22, estoque_minimo: 4, categoria: 'Escritório',  sku: 'ES-012' },
  { nome: 'Planner Mensal A4',      descricao: 'Planner com abas mensais',          preco: 59.90,   estoque: 55, estoque_minimo: 8, categoria: 'Escritório',  sku: 'ES-013' },
  { nome: 'Caderno Sketchbook A5',  descricao: '80 páginas sem pauta 180g',         preco: 39.90,   estoque: 80, estoque_minimo: 15, categoria: 'Escritório', sku: 'ES-014' },
  { nome: 'Mochila Executiva 30L',  descricao: 'Compartimento notebook 15.6"',      preco: 279.90,  estoque: 14, estoque_minimo: 3, categoria: 'Acessórios', sku: 'AC-010' },
  { nome: 'Carteira Slim RFID',     descricao: 'Couro vegano bloqueio RFID',        preco: 89.90,   estoque: 40, estoque_minimo: 8, categoria: 'Acessórios', sku: 'AC-011' },
  { nome: 'Kit Limpeza Tech',       descricao: 'Spray + pano + escova eletrônicos', preco: 44.90,   estoque: 60, estoque_minimo: 10, categoria: 'Acessórios', sku: 'AC-012' },
  { nome: 'Suporte Celular Desk',   descricao: 'Suporte de mesa articulado 360°',   preco: 34.90,   estoque: 70, estoque_minimo: 10, categoria: 'Acessórios', sku: 'AC-013' },
  { nome: 'Tênis Running',          descricao: 'Tênis corrida amortecimento EVA',   preco: 399.90,  estoque: 18, estoque_minimo: 4, categoria: 'Vestuário',  sku: 'VS-010' },
  { nome: 'Jaqueta Corta Vento',    descricao: 'Leve impermeável unissex',          preco: 199.90,  estoque: 25, estoque_minimo: 5, categoria: 'Vestuário',  sku: 'VS-011' },
  { nome: 'Vitamina C 1000mg',      descricao: '60 cápsulas suplemento',            preco: 49.90,   estoque: 90, estoque_minimo: 15, categoria: 'Alimentos', sku: 'AL-010' },
  { nome: 'Creatina Mono 300g',     descricao: 'Pura sem sabor 60 doses',           preco: 89.90,   estoque: 35, estoque_minimo: 6, categoria: 'Alimentos', sku: 'AL-011' },
]

const FORMAS = ['pix', 'credito', 'debito', 'dinheiro']

function diasAtras(n, hora) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  const h = hora ?? (Math.floor(Math.random() * 10) + 8)
  const m = Math.floor(Math.random() * 60)
  d.setHours(h, m, 0, 0)
  // Formatar como string local sem timezone para SQLite
  const pad = v => String(v).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`
}

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }

async function seed() {
  const db = await open({ filename: dbPath, driver: sqlite3.Database })

  // ── Inserir novos produtos ─────────────────────────────────────────────────
  console.log('Inserindo produtos...')
  for (const p of NOVOS_PRODUTOS) {
    const existe = await db.get('SELECT id FROM produtos WHERE sku = ?', [p.sku])
    if (!existe) {
      await db.run(
        `INSERT INTO produtos (nome, descricao, preco, estoque, estoque_minimo, categoria, sku, criado_em)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [p.nome, p.descricao, p.preco, p.estoque, p.estoque_minimo, p.categoria, p.sku]
      )
    }
  }

  const todosProdutos = await db.all('SELECT id, nome, preco, estoque FROM produtos WHERE estoque > 0')
  console.log(`Total de produtos: ${todosProdutos.length}`)

  // ── Gerar vendas para atingir ~30k a mais no faturamento ──────────────────
  console.log('Gerando vendas...')

  // Preferência por produtos de maior valor para atingir 30k mais rápido
  const produtosAltoValor = todosProdutos.filter(p => p.preco >= 150)
  const todosMix = todosProdutos

  // Garante vendas nos últimos 7 dias (pelo menos 3 por dia)
  const programacao = []

  // Últimos 7 dias: 3-5 vendas por dia (incluindo hoje)
  for (let d = 0; d <= 6; d++) {
    const qty = rand(3, 5)
    for (let i = 0; i < qty; i++) programacao.push(d)
  }

  // Dias 7-30: 2-4 vendas por dia
  for (let d = 7; d <= 30; d++) {
    const qty = rand(2, 4)
    for (let i = 0; i < qty; i++) programacao.push(d)
  }

  let faturamentoGerado = 0
  const META = 30000

  for (const diasAgo of programacao) {
    if (faturamentoGerado >= META) break

    const data = diasAtras(diasAgo)
    const forma = pick(FORMAS)
    const desconto = Math.random() < 0.12 ? rand(10, 50) : 0

    // Mistura produtos de alto valor com comuns
    const pool = faturamentoGerado < META * 0.7 ? produtosAltoValor : todosMix
    const nItens = rand(1, 3)
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, nItens)

    const itens = shuffled.map(p => {
      const qtd = rand(1, 2)
      return { produto_id: p.id, quantidade: qtd, preco_unitario: p.preco, subtotal: qtd * p.preco }
    })

    const totalBruto = itens.reduce((s, i) => s + i.subtotal, 0)
    const valorTotal = Math.max(0, totalBruto - desconto)
    const qtdItens = itens.reduce((s, i) => s + i.quantidade, 0)

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

    await db.run(
      `INSERT INTO movimentos_financeiros (descricao, valor, tipo, categoria, data, forma_pagamento, referencia_id, referencia_tipo, criado_em)
       VALUES (?, ?, 'receita', 'Vendas', ?, ?, ?, 'venda', ?)`,
      [`Venda ${numero}`, valorTotal.toFixed(2), data.split(' ')[0], forma, vendaId, data]
    )

    faturamentoGerado += valorTotal
  }

  const totalVendas = await db.get('SELECT COUNT(*) as n FROM vendas')
  const totalProdutos = await db.get('SELECT COUNT(*) as n FROM produtos')
  const fat = await db.get('SELECT COALESCE(SUM(valor_total),0) as total FROM vendas')
  const fatHoje = await db.get("SELECT COALESCE(SUM(valor_total),0) as total FROM vendas WHERE DATE(data) = DATE('now')")
  const fatMes = await db.get("SELECT COALESCE(SUM(valor_total),0) as total FROM vendas WHERE strftime('%Y-%m', data) = strftime('%Y-%m', 'now')")

  console.log(`\nPronto!`)
  console.log(`Produtos: ${totalProdutos.n}`)
  console.log(`Vendas: ${totalVendas.n}`)
  console.log(`Faturamento total: R$ ${Number(fat.total).toFixed(2)}`)
  console.log(`Faturamento hoje: R$ ${Number(fatHoje.total).toFixed(2)}`)
  console.log(`Faturamento do mês: R$ ${Number(fatMes.total).toFixed(2)}`)
  console.log(`Faturamento gerado nesta rodada: R$ ${faturamentoGerado.toFixed(2)}`)

  await db.close()
}

seed().catch(console.error)
