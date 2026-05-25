const db = require('../config/database');

class Produto {
  static async criarTabela() {
    try {
      await db.run(
        `CREATE TABLE IF NOT EXISTS produtos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nome TEXT NOT NULL,
          descricao TEXT,
          preco REAL NOT NULL,
          estoque INTEGER NOT NULL DEFAULT 0,
          estoque_minimo INTEGER NOT NULL DEFAULT 5,
          categoria TEXT,
          sku TEXT,
          criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
      );
      // Adicionar colunas novas em tabelas já existentes
      const info = await db.all(`PRAGMA table_info(produtos)`);
      const colunas = info.map(c => c.name);
      if (!colunas.includes('estoque_minimo')) {
        await db.run(`ALTER TABLE produtos ADD COLUMN estoque_minimo INTEGER NOT NULL DEFAULT 5`);
      }
      if (!colunas.includes('categoria')) {
        await db.run(`ALTER TABLE produtos ADD COLUMN categoria TEXT`);
      }
    } catch (erro) {
      throw erro;
    }
  }

  static async criar(nome, descricao, preco, estoque, sku, categoria, estoque_minimo) {
    try {
      const result = await db.run(
        `INSERT INTO produtos (nome, descricao, preco, estoque, sku, categoria, estoque_minimo) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [nome, descricao, preco, estoque, sku, categoria || null, estoque_minimo || 5]
      );
      return { id: result.lastID };
    } catch (erro) {
      throw erro;
    }
  }

  static async listar() {
    try {
      return await db.all(`SELECT * FROM produtos ORDER BY id DESC`);
    } catch (erro) {
      throw erro;
    }
  }

  static async buscarPorId(id) {
    try {
      return await db.get(`SELECT * FROM produtos WHERE id = ?`, [id]);
    } catch (erro) {
      throw erro;
    }
  }

  static async atualizar(id, nome, descricao, preco, estoque, sku, categoria, estoque_minimo) {
    try {
      const result = await db.run(
        `UPDATE produtos SET nome = ?, descricao = ?, preco = ?, estoque = ?, sku = ?, categoria = ?, estoque_minimo = ? WHERE id = ?`,
        [nome, descricao, preco, estoque, sku, categoria || null, estoque_minimo || 5, id]
      );
      return { changes: result.changes };
    } catch (erro) {
      throw erro;
    }
  }

  static async listarBaixoEstoque() {
    try {
      return await db.all(`SELECT * FROM produtos WHERE estoque <= estoque_minimo ORDER BY estoque ASC`);
    } catch (erro) {
      throw erro;
    }
  }

  static async deletar(id) {
    try {
      const result = await db.run(`DELETE FROM produtos WHERE id = ?`, [id]);
      return { changes: result.changes };
    } catch (erro) {
      throw erro;
    }
  }

  static async atualizarEstoque(id, quantidade) {
    try {
      const result = await db.run(
        `UPDATE produtos SET estoque = estoque - ? WHERE id = ?`,
        [quantidade, id]
      );
      return { changes: result.changes };
    } catch (erro) {
      throw erro;
    }
  }

  static async incrementarEstoque(id, quantidade) {
    const result = await db.run(
      `UPDATE produtos SET estoque = estoque + ? WHERE id = ?`,
      [quantidade, id]
    );
    return { changes: result.changes };
  }

  static async contarTotal() {
    const row = await db.get(`SELECT COUNT(*) as total FROM produtos`);
    return row.total;
  }

  static async semEstoque() {
    const row = await db.get(`SELECT COUNT(*) as total FROM produtos WHERE estoque = 0`);
    return row.total;
  }

  static async estoquesBaixos() {
    const row = await db.get(`SELECT COUNT(*) as total FROM produtos WHERE estoque > 0 AND estoque <= estoque_minimo`);
    return row.total;
  }

  static async alertas(limite) {
    return db.all(
      `SELECT id, nome, estoque, estoque_minimo FROM produtos WHERE estoque <= estoque_minimo ORDER BY estoque ASC LIMIT ?`,
      [limite]
    );
  }
}

module.exports = Produto;
