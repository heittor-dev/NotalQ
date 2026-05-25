const db = require('../config/database');

class Compra {
  static async criarTabela() {
    await db.run(`CREATE TABLE IF NOT EXISTS compras (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fornecedor_id INTEGER,
      numero_pedido TEXT,
      data TEXT NOT NULL,
      valor_total REAL DEFAULT 0,
      status TEXT DEFAULT 'pendente',
      observacoes TEXT,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id)
    )`);
  }

  static gerarNumeroPedido() {
    const r = Math.floor(Math.random() * 900) + 100;
    return `CP-${Date.now()}-${r}`;
  }

  static async listar() {
    return db.all(`
      SELECT c.*, f.nome AS fornecedor_nome
      FROM compras c
      LEFT JOIN fornecedores f ON c.fornecedor_id = f.id
      ORDER BY c.criado_em DESC
    `);
  }

  static async buscarPorId(id) {
    return db.get(`
      SELECT c.*, f.nome AS fornecedor_nome
      FROM compras c
      LEFT JOIN fornecedores f ON c.fornecedor_id = f.id
      WHERE c.id = ?
    `, [id]);
  }

  static async criar({ fornecedor_id, data, valor_total, observacoes }) {
    const numero_pedido = this.gerarNumeroPedido();
    const result = await db.run(
      `INSERT INTO compras (fornecedor_id, numero_pedido, data, valor_total, observacoes)
       VALUES (?,?,?,?,?)`,
      [fornecedor_id || null, numero_pedido, data, valor_total || 0, observacoes || null]
    );
    return { id: result.lastID, numero_pedido };
  }

  static async atualizarStatus(id, status) {
    const result = await db.run(`UPDATE compras SET status = ? WHERE id = ?`, [status, id]);
    return { changes: result.changes };
  }

  static async atualizar(id, { valor_total, status, observacoes }) {
    const result = await db.run(
      `UPDATE compras SET valor_total=?, status=?, observacoes=? WHERE id=?`,
      [valor_total, status, observacoes || null, id]
    );
    return { changes: result.changes };
  }

  static async contarPendentes() {
    const row = await db.get(`SELECT COUNT(*) as total FROM compras WHERE status='pendente'`);
    return row.total;
  }
}

module.exports = Compra;
