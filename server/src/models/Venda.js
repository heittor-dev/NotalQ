const db = require('../config/database');

class Venda {
  // Criar tabela
  static async criarTabela() {
    try {
      const sql = `
        CREATE TABLE IF NOT EXISTS vendas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          numero_venda TEXT UNIQUE,
          data TEXT NOT NULL,
          valor_total REAL NOT NULL DEFAULT 0,
          quantidade_itens INTEGER NOT NULL DEFAULT 0,
          desconto REAL DEFAULT 0,
          observacoes TEXT,
          forma_pagamento TEXT DEFAULT 'dinheiro',
          status TEXT DEFAULT 'finalizada',
          criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;

      await db.run(sql);

      const info = await db.all(`PRAGMA table_info(vendas)`);
      const columns = info.map((col) => col.name);
      if (!columns.includes('numero_venda')) {
        await db.run(`ALTER TABLE vendas ADD COLUMN numero_venda TEXT UNIQUE`);
      }
      if (!columns.includes('forma_pagamento')) {
        await db.run(`ALTER TABLE vendas ADD COLUMN forma_pagamento TEXT DEFAULT 'dinheiro'`);
      }
    } catch (err) {
      throw err;
    }
  }

  // Criar nova venda
  static async criar(venda) {
    try {
      const {
        numero_venda,
        data,
        valor_total,
        quantidade_itens,
        desconto,
        observacoes,
        forma_pagamento,
        status
      } = venda;

      const sql = `
        INSERT INTO vendas (numero_venda, data, valor_total, quantidade_itens, desconto, observacoes, forma_pagamento, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const result = await db.run(sql, [
        numero_venda,
        data,
        valor_total,
        quantidade_itens,
        desconto,
        observacoes,
        forma_pagamento || 'dinheiro',
        status || 'finalizada'
      ]);
      return { id: result.lastID };
    } catch (err) {
      throw err;
    }
  }

  static gerarNumeroVenda() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 900) + 100;
    return `NV-${timestamp}-${random}`;
  }

  // Obter todas as vendas
  static async obterTodas() {
    try {
      const sql = 'SELECT * FROM vendas ORDER BY data DESC';
      return (await db.all(sql)) || [];
    } catch (err) {
      throw err;
    }
  }

  // Obter venda por ID
  static async obterPorId(id) {
    try {
      const sql = 'SELECT * FROM vendas WHERE id = ?';
      return await db.get(sql, [id]);
    } catch (err) {
      throw err;
    }
  }

  static async buscarPorId(id) {
    return this.obterPorId(id);
  }

  static async listar() {
    return this.obterTodas();
  }

  // Atualizar venda
  static async atualizar(id, venda) {
    try {
      const {
        data,
        valor_total,
        quantidade_itens,
        desconto,
        observacoes,
        status,
        forma_pagamento
      } = venda;

      const sql = `
        UPDATE vendas
        SET data = ?, valor_total = ?, quantidade_itens = ?, desconto = ?, observacoes = ?, forma_pagamento = ?, status = ?
        WHERE id = ?
      `;

      const result = await db.run(sql, [
        data,
        valor_total,
        quantidade_itens,
        desconto,
        observacoes,
        forma_pagamento,
        status,
        id
      ]);
      return { changes: result.changes };
    } catch (err) {
      throw err;
    }
  }

  // Deletar venda
  static async deletar(id) {
    try {
      const sql = 'DELETE FROM vendas WHERE id = ?';
      const result = await db.run(sql, [id]);
      return { changes: result.changes };
    } catch (err) {
      throw err;
    }
  }

  // Obter vendas por data
  static async obterPorData(data) {
    try {
      const sql = 'SELECT * FROM vendas WHERE DATE(data) = DATE(?) ORDER BY data DESC';
      return await db.all(sql, [data]) || [];
    } catch (err) {
      throw err;
    }
  }

  // Obter total de vendas do dia
  static async obterTotalDoDia(data) {
    try {
      const sql = `
        SELECT
          SUM(valor_total) as total,
          COUNT(*) as quantidade_vendas,
          SUM(quantidade_itens) as total_itens
        FROM vendas
        WHERE DATE(data) = DATE(?)
      `;

      const result = await db.get(sql, [data]);
      return result || { total: 0, quantidade_vendas: 0, total_itens: 0 };
    } catch (err) {
      throw err;
    }
  }

  static async contarTotal() {
    const row = await db.get(`SELECT COUNT(*) as total FROM vendas`);
    return row.total;
  }

  static async faturamentoDia(hoje) {
    const row = await db.get(
      `SELECT COALESCE(SUM(valor_total), 0) as faturamento, COUNT(*) as quantidade FROM vendas WHERE DATE(data) = DATE(?)`,
      [hoje]
    );
    return row || { faturamento: 0, quantidade: 0 };
  }

  static async porFormaPagamento() {
    return db.all(
      `SELECT forma_pagamento, COUNT(*) as quantidade, SUM(valor_total) as total FROM vendas GROUP BY forma_pagamento ORDER BY quantidade DESC`
    );
  }

  static async ultimas(n) {
    return db.all(
      `SELECT id, numero_venda, valor_total, forma_pagamento, data FROM vendas ORDER BY criado_em DESC LIMIT ?`,
      [n]
    );
  }

  static async faturamentoMes(mesStr, anoStr) {
    const row = await db.get(
      `SELECT COALESCE(SUM(valor_total), 0) AS total FROM vendas WHERE strftime('%m',data)=? AND strftime('%Y',data)=?`,
      [mesStr, anoStr]
    );
    return row.total;
  }

  static async ticketMedio(mesStr, anoStr) {
    const row = await db.get(
      `SELECT COALESCE(AVG(valor_total), 0) AS media FROM vendas WHERE strftime('%m',data)=? AND strftime('%Y',data)=?`,
      [mesStr, anoStr]
    );
    return row.media;
  }

  static async faturamento7dias() {
    return db.all(`
      SELECT DATE(data) as dia, COUNT(*) as qtd_vendas, COALESCE(SUM(valor_total), 0) as faturamento
      FROM vendas
      WHERE DATE(data) >= DATE('now', '-6 days')
      GROUP BY DATE(data)
      ORDER BY dia ASC
    `);
  }

  static async topProdutos(mesStr, anoStr) {
    return db.all(`
      SELECT p.nome, SUM(vi.quantidade) as total_vendido, SUM(vi.subtotal) as receita
      FROM venda_itens vi
      JOIN produtos p ON vi.produto_id = p.id
      JOIN vendas v ON vi.venda_id = v.id
      WHERE strftime('%m', v.data) = ? AND strftime('%Y', v.data) = ?
      GROUP BY vi.produto_id
      ORDER BY total_vendido DESC
      LIMIT 5
    `, [mesStr, anoStr]);
  }

  static async vendasPorPeriodo(inicio, fim) {
    return db.all(`
      SELECT v.*, COUNT(vi.id) AS qtd_itens
      FROM vendas v
      LEFT JOIN venda_itens vi ON v.id = vi.venda_id
      WHERE DATE(v.data) BETWEEN DATE(?) AND DATE(?)
      GROUP BY v.id
      ORDER BY v.data DESC
    `, [inicio, fim]);
  }

  static async totaisPorPeriodo(inicio, fim) {
    return db.get(`
      SELECT COUNT(*) AS total_vendas, COALESCE(SUM(valor_total), 0) AS faturamento
      FROM vendas
      WHERE DATE(data) BETWEEN DATE(?) AND DATE(?)
    `, [inicio, fim]);
  }

  static async produtosMaisVendidos(limite) {
    return db.all(`
      SELECT p.id, p.nome, p.categoria,
        SUM(vi.quantidade) AS total_vendido,
        SUM(vi.subtotal) AS receita_total
      FROM venda_itens vi
      JOIN produtos p ON vi.produto_id = p.id
      GROUP BY vi.produto_id
      ORDER BY total_vendido DESC
      LIMIT ?
    `, [limite]);
  }

  static async faturamentoDiarioPorMes(mesStr, anoStr) {
    return db.all(`
      SELECT DATE(data) AS dia, COUNT(*) AS qtd_vendas, COALESCE(SUM(valor_total), 0) AS faturamento
      FROM vendas
      WHERE strftime('%m', data) = ? AND strftime('%Y', data) = ?
      GROUP BY DATE(data)
      ORDER BY dia ASC
    `, [mesStr, anoStr]);
  }
}

module.exports = Venda;
