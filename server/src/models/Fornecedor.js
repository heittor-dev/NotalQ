const db = require('../config/database');

class Fornecedor {
  static async criarTabela() {
    await db.run(`CREATE TABLE IF NOT EXISTS fornecedores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      cnpj TEXT,
      email TEXT,
      telefone TEXT,
      endereco TEXT,
      categoria TEXT,
      ativo INTEGER DEFAULT 1,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  }

  static async listar() {
    return db.all(`SELECT * FROM fornecedores ORDER BY nome ASC`);
  }

  static async buscarPorId(id) {
    return db.get(`SELECT * FROM fornecedores WHERE id = ?`, [id]);
  }

  static async criar({ nome, cnpj, email, telefone, endereco, categoria }) {
    const result = await db.run(
      `INSERT INTO fornecedores (nome, cnpj, email, telefone, endereco, categoria) VALUES (?,?,?,?,?,?)`,
      [nome, cnpj || null, email || null, telefone || null, endereco || null, categoria || null]
    );
    return { id: result.lastID };
  }

  static async atualizar(id, { nome, cnpj, email, telefone, endereco, categoria, ativo }) {
    const result = await db.run(
      `UPDATE fornecedores SET nome=?, cnpj=?, email=?, telefone=?, endereco=?, categoria=?, ativo=? WHERE id=?`,
      [nome, cnpj || null, email || null, telefone || null, endereco || null, categoria || null, ativo ?? 1, id]
    );
    return { changes: result.changes };
  }

  static async deletar(id) {
    const result = await db.run(`UPDATE fornecedores SET ativo = 0 WHERE id = ?`, [id]);
    return { changes: result.changes };
  }
}

module.exports = Fornecedor;
