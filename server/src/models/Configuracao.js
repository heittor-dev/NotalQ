const db = require('../config/database');

const DEFAULTS = [
  { chave: 'nome_empresa', valor: 'PDV System' },
  { chave: 'cnpj',         valor: '' },
  { chave: 'telefone',     valor: '' },
  { chave: 'endereco',     valor: '' },
  { chave: 'moeda',        valor: 'BRL' },
];

class Configuracao {
  static async criarTabela() {
    await db.run(`CREATE TABLE IF NOT EXISTS configuracoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chave TEXT NOT NULL UNIQUE,
      valor TEXT,
      atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    for (const { chave, valor } of DEFAULTS) {
      await db.run(
        `INSERT OR IGNORE INTO configuracoes (chave, valor) VALUES (?, ?)`,
        [chave, valor]
      );
    }
  }

  static async listar() {
    const rows = await db.all(`SELECT chave, valor FROM configuracoes`);
    return rows.reduce((acc, r) => ({ ...acc, [r.chave]: r.valor }), {});
  }

  static async atualizar(chave, valor) {
    await db.run(
      `INSERT INTO configuracoes (chave, valor) VALUES (?, ?)
       ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor, atualizado_em = CURRENT_TIMESTAMP`,
      [chave, valor]
    );
  }
}

module.exports = Configuracao;
