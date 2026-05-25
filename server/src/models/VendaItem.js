const db = require('../config/database');

class VendaItem {
  static async criarTabela() {
    try {
      await db.run(
        `CREATE TABLE IF NOT EXISTS venda_itens (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          venda_id INTEGER NOT NULL,
          produto_id INTEGER NOT NULL,
          quantidade INTEGER NOT NULL,
          preco_unitario REAL NOT NULL,
          subtotal REAL NOT NULL,
          criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (venda_id) REFERENCES vendas(id) ON DELETE CASCADE,
          FOREIGN KEY (produto_id) REFERENCES produtos(id)
        )`
      );
    } catch (erro) {
      throw erro;
    }
  }

  static async criar(vendaId, produtoId, quantidade, precoUnitario, subtotal) {
    try {
      const result = await db.run(
        `INSERT INTO venda_itens (venda_id, produto_id, quantidade, preco_unitario, subtotal) VALUES (?, ?, ?, ?, ?)`,
        [vendaId, produtoId, quantidade, precoUnitario, subtotal]
      );
      return { id: result.lastID };
    } catch (erro) {
      throw erro;
    }
  }

  static async listarPorVenda(vendaId) {
    try {
      return await db.all(`SELECT * FROM venda_itens WHERE venda_id = ?`, [vendaId]);
    } catch (erro) {
      throw erro;
    }
  }

  static async deletarPorVenda(vendaId) {
    try {
      const result = await db.run(`DELETE FROM venda_itens WHERE venda_id = ?`, [vendaId]);
      return { changes: result.changes };
    } catch (erro) {
      throw erro;
    }
  }
}

module.exports = VendaItem;
