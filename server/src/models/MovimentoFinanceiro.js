const db = require('../config/database');

class MovimentoFinanceiro {
  static async criarTabela() {
    await db.run(`CREATE TABLE IF NOT EXISTS movimentos_financeiros (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT NOT NULL,
      categoria TEXT,
      descricao TEXT NOT NULL,
      valor REAL NOT NULL,
      data TEXT NOT NULL,
      forma_pagamento TEXT,
      referencia_id INTEGER,
      referencia_tipo TEXT,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  }

  static async listar({ tipo, data_inicio, data_fim } = {}) {
    let sql = `SELECT * FROM movimentos_financeiros WHERE 1=1`;
    const params = [];
    if (tipo) { sql += ` AND tipo = ?`; params.push(tipo); }
    if (data_inicio) { sql += ` AND DATE(data) >= DATE(?)`; params.push(data_inicio); }
    if (data_fim) { sql += ` AND DATE(data) <= DATE(?)`; params.push(data_fim); }
    sql += ` ORDER BY data DESC, criado_em DESC`;
    return db.all(sql, params);
  }

  static async resumo({ data_inicio, data_fim } = {}) {
    const hoje = new Date().toISOString().split('T')[0];
    const ini = data_inicio || `${hoje.slice(0,7)}-01`;
    const fim = data_fim || hoje;
    const row = await db.get(`
      SELECT
        COALESCE(SUM(CASE WHEN tipo='receita' THEN valor ELSE 0 END), 0) AS receitas,
        COALESCE(SUM(CASE WHEN tipo='despesa' THEN valor ELSE 0 END), 0) AS despesas
      FROM movimentos_financeiros
      WHERE DATE(data) BETWEEN DATE(?) AND DATE(?)
    `, [ini, fim]);
    return { ...row, saldo: row.receitas - row.despesas, data_inicio: ini, data_fim: fim };
  }

  static async criar({ tipo, categoria, descricao, valor, data, forma_pagamento, referencia_id, referencia_tipo }) {
    const result = await db.run(
      `INSERT INTO movimentos_financeiros (tipo, categoria, descricao, valor, data, forma_pagamento, referencia_id, referencia_tipo)
       VALUES (?,?,?,?,?,?,?,?)`,
      [tipo, categoria || null, descricao, valor, data, forma_pagamento || null, referencia_id || null, referencia_tipo || null]
    );
    return { id: result.lastID };
  }

  static async deletar(id) {
    const result = await db.run(`DELETE FROM movimentos_financeiros WHERE id = ?`, [id]);
    return { changes: result.changes };
  }

  static async totaisAcumulados() {
    return db.get(`
      SELECT
        COALESCE(SUM(CASE WHEN tipo='receita' THEN valor ELSE 0 END), 0) AS receitas_total,
        COALESCE(SUM(CASE WHEN tipo='despesa' THEN valor ELSE 0 END), 0) AS despesas_total
      FROM movimentos_financeiros
    `);
  }

  static async despesasMes(mesStr, anoStr) {
    const row = await db.get(
      `SELECT COALESCE(SUM(valor), 0) AS total FROM movimentos_financeiros WHERE tipo='despesa' AND strftime('%m',data)=? AND strftime('%Y',data)=?`,
      [mesStr, anoStr]
    );
    return row.total;
  }
}

module.exports = MovimentoFinanceiro;
