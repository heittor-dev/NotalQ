const sqlite3 = require('sqlite3')
const { open } = require('sqlite')
const path = require('path')

const dbPath = path.join(__dirname, 'database/pdv.db')

function pad(v) { return String(v).padStart(2, '0') }

function dataLocal(diasAtras, diaFixo) {
  const d = new Date()
  d.setDate(d.getDate() - diasAtras)
  const hora = diaFixo ?? (Math.floor(Math.random() * 8) + 8)
  d.setHours(hora, Math.floor(Math.random() * 60), 0, 0)
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`
}

function dataStr(diasAtras) {
  const d = new Date()
  d.setDate(d.getDate() - diasAtras)
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
}

function rand(min, max) { return +(min + Math.random() * (max - min)).toFixed(2) }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }

// Despesas fixas mensais (recorrentes nos últimos 3 meses)
const FIXAS = [
  { descricao: 'Aluguel do ponto comercial',    categoria: 'Aluguel',       valor: 3800.00, dia: 5  },
  { descricao: 'Conta de energia elétrica',     categoria: 'Utilidades',    valor: 0,       dia: 10, variavel: [380, 620] },
  { descricao: 'Internet fibra 500MB',           categoria: 'Utilidades',    valor: 189.90,  dia: 12 },
  { descricao: 'Telefone empresarial',           categoria: 'Utilidades',    valor: 99.90,   dia: 12 },
  { descricao: 'Salário — Luiz Otávio',          categoria: 'Salários',      valor: 3500.00, dia: 5  },
  { descricao: 'Salário — Funcionário 1',        categoria: 'Salários',      valor: 2200.00, dia: 5  },
  { descricao: 'Salário — Funcionário 2',        categoria: 'Salários',      valor: 1980.00, dia: 5  },
  { descricao: 'FGTS e encargos trabalhistas',   categoria: 'Salários',      valor: 0,       dia: 7,  variavel: [1100, 1400] },
  { descricao: 'Contador / Honorários',          categoria: 'Contabilidade', valor: 650.00,  dia: 15 },
  { descricao: 'Simples Nacional — DAS',         categoria: 'Impostos',      valor: 0,       dia: 20, variavel: [1200, 2400] },
  { descricao: 'Plano de saúde empresarial',     categoria: 'Benefícios',    valor: 890.00,  dia: 8  },
  { descricao: 'Vale transporte funcionários',   categoria: 'Benefícios',    valor: 0,       dia: 28, variavel: [380, 520] },
  { descricao: 'Sistema ERP / Software',         categoria: 'Tecnologia',    valor: 149.90,  dia: 1  },
  { descricao: 'Manutenção do site',             categoria: 'Tecnologia',    valor: 350.00,  dia: 3  },
]

// Despesas variáveis / avulsas espalhadas nos últimos 60 dias
const AVULSAS = [
  // Marketing
  { descricao: 'Anúncios Google Ads',         categoria: 'Marketing',     valor: [280, 650] },
  { descricao: 'Impulsionamento Instagram',   categoria: 'Marketing',     valor: [150, 400] },
  { descricao: 'Criação de banner/arte',      categoria: 'Marketing',     valor: [200, 500] },
  // Operacional
  { descricao: 'Material de limpeza',         categoria: 'Operacional',   valor: [80, 180]  },
  { descricao: 'Material de escritório',      categoria: 'Operacional',   valor: [120, 280] },
  { descricao: 'Embalagens e sacolas',        categoria: 'Operacional',   valor: [180, 420] },
  { descricao: 'Frete / Correios',            categoria: 'Logística',     valor: [90, 310]  },
  { descricao: 'Motoboy entrega local',       categoria: 'Logística',     valor: [60, 180]  },
  // Manutenção
  { descricao: 'Manutenção equipamentos',     categoria: 'Manutenção',    valor: [150, 600] },
  { descricao: 'Reparo no ponto comercial',   categoria: 'Manutenção',    valor: [200, 900] },
  // Outros
  { descricao: 'Treinamento / Capacitação',   categoria: 'Educação',      valor: [250, 800] },
  { descricao: 'Reembolso funcionário',       categoria: 'Operacional',   valor: [50, 200]  },
  { descricao: 'Seguro empresarial',          categoria: 'Seguros',       valor: [320, 320] },
  { descricao: 'Combustível veículo empresa', categoria: 'Transporte',    valor: [180, 380] },
  { descricao: 'Estacionamento / pedágio',    categoria: 'Transporte',    valor: [40, 120]  },
  { descricao: 'Alimentação equipe',          categoria: 'Alimentação',   valor: [120, 350] },
  { descricao: 'Água mineral / café',         categoria: 'Alimentação',   valor: [60, 120]  },
]

const FORMAS = ['pix', 'transferencia', 'debito', 'boleto', 'dinheiro']

async function seed() {
  const db = await open({ filename: dbPath, driver: sqlite3.Database })

  let inseridos = 0

  // ── Despesas fixas: 3 meses atrás → mês atual ───────────────────────────
  for (let mesAtras = 2; mesAtras >= 0; mesAtras--) {
    for (const fixa of FIXAS) {
      const d = new Date()
      d.setMonth(d.getMonth() - mesAtras)
      d.setDate(fixa.dia)
      d.setHours(9, 0, 0, 0)
      const data = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
      const criado = `${data} 09:00:00`
      const valor = fixa.variavel ? rand(...fixa.variavel) : fixa.valor

      // Só inserir se a data não for futura
      if (new Date(data) > new Date()) continue

      await db.run(
        `INSERT INTO movimentos_financeiros (tipo, categoria, descricao, valor, data, forma_pagamento, criado_em)
         VALUES ('despesa', ?, ?, ?, ?, ?, ?)`,
        [fixa.categoria, fixa.descricao, valor, data, pick(FORMAS), criado]
      )
      inseridos++
    }
  }

  // ── Despesas avulsas: ~2-4 por semana nos últimos 60 dias ────────────────
  for (let diasAgo = 60; diasAgo >= 0; diasAgo--) {
    // A cada ~3 dias gera uma despesa avulsa
    if (Math.random() > 0.35) continue
    const avulsa = pick(AVULSAS)
    const valor = rand(...avulsa.valor)
    const ts = dataLocal(diasAgo)
    const data = dataStr(diasAgo)
    await db.run(
      `INSERT INTO movimentos_financeiros (tipo, categoria, descricao, valor, data, forma_pagamento, criado_em)
       VALUES ('despesa', ?, ?, ?, ?, ?, ?)`,
      [avulsa.categoria, avulsa.descricao, valor, data, pick(FORMAS), ts]
    )
    inseridos++
  }

  // ── Resumo ────────────────────────────────────────────────────────────────
  const total = await db.get("SELECT COUNT(*) as n, SUM(valor) as s FROM movimentos_financeiros WHERE tipo='despesa'")
  const mesSaldo = await db.get(`
    SELECT
      COALESCE(SUM(CASE WHEN tipo='receita' THEN valor END),0) as rec,
      COALESCE(SUM(CASE WHEN tipo='despesa' THEN valor END),0) as des
    FROM movimentos_financeiros
    WHERE strftime('%Y-%m', data) = strftime('%Y-%m', 'now')
  `)

  console.log(`\nInseridas: ${inseridos} despesas`)
  console.log(`Total despesas no banco: ${total.n} | R$ ${Number(total.s).toFixed(2)}`)
  console.log(`\nMês atual:`)
  console.log(`  Receitas: R$ ${Number(mesSaldo.rec).toFixed(2)}`)
  console.log(`  Despesas: R$ ${Number(mesSaldo.des).toFixed(2)}`)
  console.log(`  Saldo:    R$ ${(mesSaldo.rec - mesSaldo.des).toFixed(2)}`)

  await db.close()
}

seed().catch(console.error)
