const db = require('../config/database');

class Usuario {
  static async criarTabela() {
    await db.run(`CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      senha_hash TEXT NOT NULL,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  }

  static async criar(nome, email, senhaHash) {
    const result = await db.run(
      `INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)`,
      [nome, email, senhaHash]
    );
    return { id: result.lastID };
  }

  static async buscarPorEmail(email) {
    return db.get(`SELECT * FROM usuarios WHERE email = ?`, [email]);
  }

  static async contar() {
    const row = await db.get(`SELECT COUNT(*) as total FROM usuarios`);
    return row.total;
  }
}

module.exports = Usuario;
