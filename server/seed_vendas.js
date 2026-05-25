const sqlite3 = require('sqlite3')
const { open } = require('sqlite')
const path = require('path')

const dbPath = path.join(__dirname, 'database/pdv.db')
const pad = v => String(v).padStart(2, '0')
const rand = (min, max) => +(min + Math.random() * (max - min)).toFixed(2)
const pick = arr => arr[Math.floor(Math.random() * arr.length)]

const FORMAS = ['pix', 'credito', 'debito', 'dinheiro']

function dataDoMes(mesesAtras, dia, hora, minuto) {
  const d = new Date()
  d.setMonth(d.getMonth() - mesesAtras)
  d.setDate(dia)
  d.setHours(hora, minuto, 0, 0)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(hora)}:${pad(minuto)}:00`
}

const NOVOS_PRODUTOS = [
  // Vestuário
  { nome: 'Polo Masculina M',       descricao: 'Camisa polo algodão masculina M',  preco: 89.9,   estoque: 50, sku: 'VES-POLO-M-001',  categoria: 'Vestuário' },
  { nome: 'Polo Masculina G',       descricao: 'Camisa polo algodão masculina G',  preco: 89.9,   estoque: 45, sku: 'VES-POLO-G-002',  categoria: 'Vestuário' },
  { nome: 'Calça Jogger M',         descricao: 'Calça jogger moletom masculina',   preco: 149.9,  estoque: 35, sku: 'VES-JOGM-003',    categoria: 'Vestuário' },
  { nome: 'Shorts Esportivo',       descricao: 'Shorts dry-fit academia',          preco: 69.9,   estoque: 60, sku: 'VES-SHOR-004',    categoria: 'Vestuário' },
  // Eletrônicos
  { nome: 'Cabo USB-C 2m',          descricao: 'Cabo USB-C carga rápida 2m',       preco: 29.9,   estoque: 120, sku: 'ELE-CUSBC-005',  categoria: 'Eletrônicos' },
  { nome: 'Adaptador HDMI-VGA',     descricao: 'Adaptador HDMI para VGA',          preco: 49.9,   estoque: 40, sku: 'ELE-HDMIVGA-006', categoria: 'Eletrônicos' },
  { nome: 'Suporte TV Articulado',  descricao: 'Suporte articulado TV 32-55"',     preco: 149.9,  estoque: 20, sku: 'ELE-SUPRTV-007',  categoria: 'Eletrônicos' },
  { nome: 'Régua de Energia 5T',    descricao: 'Régua com 5 tomadas + USB',        preco: 89.9,   estoque: 30, sku: 'ELE-REGUA-008',   categoria: 'Eletrônicos' },
  { nome: 'Webcam 4K',              descricao: 'Webcam 4K USB com microfone',       preco: 349.9,  estoque: 8,  sku: 'ELE-WEB4K-009',   categoria: 'Eletrônicos' },
  // Escritório
  { nome: 'Pasta AZ 350mm',         descricao: 'Pasta AZ lombada larga 350mm',     preco: 24.9,   estoque: 80, sku: 'ESC-PASTA-010',   categoria: 'Escritório' },
  { nome: 'Grampeador de Mesa',     descricao: 'Grampeador médio até 30fls',        preco: 39.9,   estoque: 50, sku: 'ESC-GRAM-011',    categoria: 'Escritório' },
  { nome: 'Post-it 100fls',         descricao: 'Bloco de notas adesivo amarelo',   preco: 14.9,   estoque: 200, sku: 'ESC-POST-012',   categoria: 'Escritório' },
  { nome: 'Marcador Permanente cx4',descricao: 'Caixa com 4 marcadores Sharpie',   preco: 19.9,   estoque: 100, sku: 'ESC-MARC-013',   categoria: 'Escritório' },
  // Saúde
  { nome: 'Ômega 3 60 caps',        descricao: 'Ômega 3 EPA DHA 60 cápsulas',      preco: 59.9,   estoque: 80, sku: 'SAU-OME3-014',    categoria: 'Saúde' },
  { nome: 'Colágeno Hidrolisado',   descricao: 'Colágeno + Vit C 300g sachê',       preco: 69.9,   estoque: 65, sku: 'SAU-COLA-015',    categoria: 'Saúde' },
  { nome: 'Magnésio 500mg 60cp',    descricao: 'Magnésio quelato 500mg 60 caps',   preco: 44.9,   estoque: 70, sku: 'SAU-MAGN-016',    categoria: 'Saúde' },
  // Casa
  { nome: 'Difusor Aromatizador',   descricao: 'Difusor ultrassônico + óleos',     preco: 129.9,  estoque: 25, sku: 'CAS-DIFUS-017',   categoria: 'Casa' },
  { nome: 'Porta-Trecos Bambu',     descricao: 'Organizador de mesa em bambu',     preco: 49.9,   estoque: 40, sku: 'CAS-PTREB-018',   categoria: 'Casa' },
  { nome: 'Caixa Organizadora G',   descricao: 'Caixa plástica organizadora 30L',  preco: 34.9,   estoque: 55, sku: 'CAS-CXORG-019',   categoria: 'Casa' },
  // Alimentos
  { nome: 'Amendoim Crunchy 500g',  descricao: 'Pasta amendoim crunchy 500g',      preco: 26.9,   estoque: 90, sku: 'ALI-AMEND-020',   categoria: 'Alimentos' },
  { nome: 'Proteína Veg 900g',      descricao: 'Proteína vegetal sabor chocolate', preco: 139.9,  estoque: 30, sku: 'ALI-PVEG-021',    categoria: 'Alimentos' },
  { nome: 'Chá Verde cx20',         descricao: 'Chá verde 20 sachês importado',    preco: 22.9,   estoque: 110, sku: 'ALI-CHAV-022',   categoria: 'Alimentos' },
  // Acessórios
  { nome: 'Pulseira Smartwatch 42', descricao: 'Pulseira silicone p/ smartwatch',  preco: 29.9,   estoque: 60, sku: 'ACE-PULS-023',    categoria: 'Acessórios' },
  { nome: 'Película Gel Universal', descricao: 'Película protetora gel universal', preco: 19.9,   estoque: 100, sku: 'ACE-PELI-024',   categoria: 'Acessórios' },
  { nome: 'Case Notebook 15"',      descricao: 'Case neoprene notebook 15.6"',     preco: 59.9,   estoque: 35, sku: 'ACE-CASE-025',    categoria: 'Acessórios' },
]

async function seed() {
  const db = await open({ filename: dbPath, driver: sqlite3.Database })

  // ─── 1. Inserir novos produtos ───────────────────────────────────────────────
  let prodInsert = 0
  for (const p of NOVOS_PRODUTOS) {
    const existe = await db.get('SELECT id FROM produtos WHERE sku = ?', [p.sku])
    if (existe) continue
    await db.run(
      `INSERT INTO produtos (nome, descricao, preco, estoque, sku, categoria, estoque_minimo)
       VALUES (?, ?, ?, ?, ?, ?, 5)`,
      [p.nome, p.descricao, p.preco, p.estoque, p.sku, p.categoria]
    )
    prodInsert++
  }
  console.log(`\n✓ ${prodInsert} novos produtos inseridos`)

  // ─── 2. Aumentar estoque dos produtos existentes ─────────────────────────────
  await db.run(`UPDATE produtos SET estoque = estoque + CAST(estoque * 2.5 AS INT) WHERE id <= 54 AND estoque < 200`)
  console.log('✓ Estoque dos produtos existentes aumentado')

  // ─── 3. Gerar vendas históricas ──────────────────────────────────────────────
  const produtos = await db.all('SELECT id, preco FROM produtos')
  const lastVenda = await db.get('SELECT COALESCE(MAX(id),0) as maxId FROM vendas')
  let vendaNum = lastVenda.maxId + 1

  // Distribuição: 24 meses × ~30 vendas/mês ≈ 720 novas vendas
  const MESES = 24
  const VENDAS_POR_MES = 30
  let totalInserido = 0

  for (let m = MESES; m >= 1; m--) {
    const nVendas = Math.floor(rand(VENDAS_POR_MES - 5, VENDAS_POR_MES + 10))

    for (let v = 0; v < nVendas; v++) {
      const dia = Math.floor(rand(1, 28))
      const hora = Math.floor(rand(8, 20))
      const minuto = Math.floor(rand(0, 59))
      const ts = dataDoMes(m, dia, hora, minuto)
      const forma = pick(FORMAS)
      const numItens = Math.floor(rand(1, 4))

      // Sortear itens únicos
      const shuffled = [...produtos].sort(() => Math.random() - 0.5)
      const itens = shuffled.slice(0, numItens)
      let total = 0
      const itensParsed = itens.map(p => {
        const qty = Math.floor(rand(1, 4))
        const subtotal = +(p.preco * qty).toFixed(2)
        total += subtotal
        return { produto_id: p.id, preco: p.preco, qty, subtotal }
      })
      total = +total.toFixed(2)

      const numVenda = `VND-${String(vendaNum).padStart(4, '0')}`
      const result = await db.run(
        `INSERT INTO vendas (numero_venda, valor_total, forma_pagamento, status, data, criado_em)
         VALUES (?, ?, ?, 'aprovado', ?, ?)`,
        [numVenda, total, forma, ts.split(' ')[0], ts]
      )
      const vendaId = result.lastID

      for (const it of itensParsed) {
        await db.run(
          `INSERT INTO venda_itens (venda_id, produto_id, quantidade, preco_unitario, subtotal)
           VALUES (?, ?, ?, ?, ?)`,
          [vendaId, it.produto_id, it.qty, it.preco, it.subtotal]
        )
      }

      vendaNum++
      totalInserido++
    }
  }

  // ─── Verificação final ────────────────────────────────────────────────────────
  const fin = await db.get('SELECT COUNT(*) as c, COALESCE(SUM(valor_total),0) as t FROM vendas')
  const prods = await db.get('SELECT COUNT(*) as c FROM produtos')
  console.log(`✓ ${totalInserido} vendas inseridas`)
  console.log(`\nResultado:`)
  console.log(`  Vendas: ${fin.c} | Total: R$ ${Number(fin.t).toFixed(2)}`)
  console.log(`  Produtos: ${prods.c}`)

  await db.close()
}

seed().catch(console.error)
