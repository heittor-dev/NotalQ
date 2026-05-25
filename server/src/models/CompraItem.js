const db = require('../config/database');

class CompraItem {
  static async criarTabela() {
    await db.run(`CREATE TABLE IF NOT EXISTS compra_itens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      compra_id INTEGER NOT NULL,
      produto_id INTEGER NOT NULL,
      quantidade INTEGER NOT NULL,
      preco_unitario REAL NOT NULL,
      subtotal REAL NOT NULL,
      FOREIGN KEY (compra_id) REFERENCES compras(id) ON DELETE CASCADE,
      FOREIGN KEY (produto_id) REFERENCES produtos(id)
    )`);
  }

  static async criar(compra_id, produto_id, quantidade, preco_unitario, subtotal) {
    const result = await db.run(
      `INSERT INTO compra_itens (compra_id, produto_id, quantidade, preco_unitario, subtotal)
       VALUES (?,?,?,?,?)`,
      [compra_id, produto_id, quantidade, preco_unitario, subtotal]
    );
    return { id: result.lastID };
  }

  static async listarPorCompra(compra_id) {
    return db.all(`
      SELECT ci.*, p.nome AS produto_nome
      FROM compra_itens ci
      JOIN produtos p ON ci.produto_id = p.id
      WHERE ci.compra_id = ?
    `, [compra_id]);
  }
}

module.exports = CompraItem;
