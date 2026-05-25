const sqlite3 = require('sqlite3')
const { open } = require('sqlite')
const path = require('path')

const dbPath = path.join(__dirname, 'database/pdv.db')
const pad = v => String(v).padStart(2, '0')

// Metas finais
const META_RECEITAS  = 1463931.87
const META_DESPESAS  = META_RECEITAS * 0.3765   // 550.969,35

function rand(min, max) { return +(min + Math.random() * (max - min)).toFixed(2) }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }

function dataDoMes(anoOffset, mesOffset, dia, hora) {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - mesOffset + (anoOffset * 12 * -1))
  // meses atrás simples:
  const alvo = new Date()
  alvo.setMonth(alvo.getMonth() - mesOffset)
  alvo.setDate(dia)
  alvo.setHours(hora, Math.floor(Math.random() * 60), 0, 0)
  return `${alvo.getFullYear()}-${pad(alvo.getMonth()+1)}-${pad(alvo.getDate())} ${pad(alvo.getHours())}:${pad(alvo.getMinutes())}:00`
}

const FORMAS_REC = ['pix', 'credito', 'debito', 'dinheiro']
const FORMAS_DES = ['pix', 'transferencia', 'debito', 'boleto', 'dinheiro']

// Despesas fixas mensais (vão compor os 37,65%)
const FIXAS = [
  { descricao: 'Aluguel do ponto comercial',   categoria: 'Aluguel',       valor: 3800 },
  { descricao: 'Salário — Luiz Otávio',         categoria: 'Salários',      valor: 3500 },
  { descricao: 'Salário — Funcionário 1',       categoria: 'Salários',      valor: 2200 },
  { descricao: 'Salário — Funcionário 2',       categoria: 'Salários',      valor: 1980 },
  { descricao: 'Conta de energia elétrica',     categoria: 'Utilidades',    valor: [380, 620] },
  { descricao: 'Internet fibra 500MB',           categoria: 'Utilidades',    valor: 189.90 },
  { descricao: 'Simples Nacional — DAS',         categoria: 'Impostos',      valor: [1200, 2400] },
  { descricao: 'FGTS e encargos trabalhistas',   categoria: 'Salários',      valor: [1100, 1400] },
  { descricao: 'Contador / Honorários',          categoria: 'Contabilidade', valor: 650 },
  { descricao: 'Plano de saúde empresarial',     categoria: 'Benefícios',    valor: 890 },
  { descricao: 'Vale transporte funcionários',   categoria: 'Benefícios',    valor: [380, 520] },
  { descricao: 'Sistema ERP / Software',         categoria: 'Tecnologia',    valor: 149.90 },
  { descricao: 'Anúncios Google Ads',            categoria: 'Marketing',     valor: [280, 650] },
  { descricao: 'Material de limpeza',            categoria: 'Operacional',   valor: [80, 180] },
  { descricao: 'Embalagens e sacolas',           categoria: 'Operacional',   valor: [180, 420] },
  { descricao: 'Frete / Correios',               categoria: 'Logística',     valor: [90, 310] },
]

// Categorias de receita para o histórico
const CATS_REC = [
  { descricao: 'Vendas balcão',         categoria: 'Vendas' },
  { descricao: 'Vendas online',         categoria: 'Vendas' },
  { descricao: 'Venda atacado',         categoria: 'Vendas' },
  { descricao: 'Serviços prestados',    categoria: 'Serviços' },
  { descricao: 'Consultoria técnica',   categoria: 'Serviços' },
]

async function seed() {
  const db = await open({ filename: dbPath, driver: sqlite3.Database })

  const atual = await db.get("SELECT COALESCE(SUM(valor),0) as t FROM movimentos_financeiros WHERE tipo='receita'")
  const atualDes = await db.get("SELECT COALESCE(SUM(valor),0) as t FROM movimentos_financeiros WHERE tipo='despesa'")

  let receitasAtuais = Number(atual.t)
  let despesasAtuais = Number(atualDes.t)

  console.log(`\nSituação atual:`)
  console.log(`  Receitas: R$ ${receitasAtuais.toFixed(2)}`)
  console.log(`  Despesas: R$ ${despesasAtuais.toFixed(2)}`)
  console.log(`\nMetas:`)
  console.log(`  Receitas alvo: R$ ${META_RECEITAS.toFixed(2)}`)
  console.log(`  Despesas alvo: R$ ${META_DESPESAS.toFixed(2)}`)

  let recInsert = 0, desInsert = 0
  let recAdicionada = 0, desAdicionada = 0

  // Distribuir ao longo de 24 meses (2 anos atrás, mês a mês)
  // Mês 24 = 24 meses atrás, Mês 1 = 1 mês atrás
  const MESES = 24

  const receitaNecessaria = Math.max(0, META_RECEITAS - receitasAtuais)
  const despesaNecessaria = Math.max(0, META_DESPESAS - despesasAtuais)

  // Distribuição com leve crescimento mês a mês (mais recente = mais receita)
  // Pesos crescentes: mês 24 tem peso 1, mês 1 tem peso 2
  const pesos = Array.from({ length: MESES }, (_, i) => 1 + (i / MESES))
  const somaPesos = pesos.reduce((s, p) => s + p, 0)

  for (let m = MESES; m >= 1; m--) {
    const peso = pesos[MESES - m]
    const recMes = (receitaNecessaria * peso) / somaPesos
    const desMes = (despesaNecessaria * peso) / somaPesos

    // ── Receitas do mês: 8–14 lançamentos ───────────────────────────────
    const nRec = Math.floor(rand(8, 14))
    let recRestante = recMes

    for (let i = 0; i < nRec; i++) {
      const ultimo = i === nRec - 1
      const valor = ultimo ? +recRestante.toFixed(2) : rand(recMes * 0.04, recMes * 0.18)
      recRestante -= valor
      if (valor <= 0) continue

      const cat = pick(CATS_REC)
      const dia = Math.floor(rand(1, 28))
      const ts = dataDoMes(0, m, dia, Math.floor(rand(8, 18)))

      await db.run(
        `INSERT INTO movimentos_financeiros (tipo, categoria, descricao, valor, data, forma_pagamento, criado_em)
         VALUES ('receita', ?, ?, ?, ?, ?, ?)`,
        [cat.categoria, cat.descricao, valor, ts.split(' ')[0], pick(FORMAS_REC), ts]
      )
      recAdicionada += valor
      recInsert++
    }

    // ── Despesas fixas do mês ────────────────────────────────────────────
    let desFixaDoMes = 0
    for (const fixa of FIXAS) {
      const valor = Array.isArray(fixa.valor) ? rand(...fixa.valor) : fixa.valor
      const dia = Math.floor(rand(1, 25))
      const ts = dataDoMes(0, m, dia, 9)
      await db.run(
        `INSERT INTO movimentos_financeiros (tipo, categoria, descricao, valor, data, forma_pagamento, criado_em)
         VALUES ('despesa', ?, ?, ?, ?, ?, ?)`,
        [fixa.categoria, fixa.descricao, valor, ts.split(' ')[0], pick(FORMAS_DES), ts]
      )
      desFixaDoMes += valor
      desAdicionada += valor
      desInsert++
    }

    // ── Despesas variáveis para complementar a cota do mês ───────────────
    const desFaltante = desMes - desFixaDoMes
    if (desFaltante > 0) {
      const nVar = Math.floor(rand(2, 5))
      let varRestante = desFaltante
      for (let i = 0; i < nVar; i++) {
        const ultimo = i === nVar - 1
        const valor = ultimo ? +varRestante.toFixed(2) : rand(desFaltante * 0.1, desFaltante * 0.4)
        varRestante -= valor
        if (valor <= 0) continue
        const dia = Math.floor(rand(1, 28))
        const ts = dataDoMes(0, m, dia, Math.floor(rand(8, 17)))
        await db.run(
          `INSERT INTO movimentos_financeiros (tipo, categoria, descricao, valor, data, forma_pagamento, criado_em)
           VALUES ('despesa', 'Operacional', 'Despesas operacionais diversas', ?, ?, ?, ?)`,
          [valor, ts.split(' ')[0], pick(FORMAS_DES), ts]
        )
        desAdicionada += valor
        desInsert++
      }
    }
  }

  // Verificação final
  const finalRec = await db.get("SELECT COALESCE(SUM(valor),0) as t FROM movimentos_financeiros WHERE tipo='receita'")
  const finalDes = await db.get("SELECT COALESCE(SUM(valor),0) as t FROM movimentos_financeiros WHERE tipo='despesa'")
  const fr = Number(finalRec.t)
  const fd = Number(finalDes.t)

  console.log(`\n✓ Inseridos: ${recInsert} receitas | ${desInsert} despesas`)
  console.log(`\nResultado final:`)
  console.log(`  Receitas:  R$ ${fr.toFixed(2)}  (alvo R$ ${META_RECEITAS.toFixed(2)})`)
  console.log(`  Despesas:  R$ ${fd.toFixed(2)}  (alvo R$ ${META_DESPESAS.toFixed(2)})`)
  console.log(`  Saldo:     R$ ${(fr - fd).toFixed(2)}`)
  console.log(`  % despesas sobre receitas: ${((fd / fr) * 100).toFixed(2)}%`)

  await db.close()
}

seed().catch(console.error)
