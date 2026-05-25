const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

let db = null;
const dbPath = path.join(__dirname, '../../database/pdv.db');

// Inicializar conexão SQLite
async function inicializar() {
  if (!db) {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    console.log('✓ Conexão SQLite estabelecida');
  }
  return db;
}

// Função para executar query
async function run(sql, params = []) {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return await db.run(sql, params);
}

// Função para obter um registro
async function get(sql, params = []) {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return await db.get(sql, params);
}

// Função para obter todos os registros
async function all(sql, params = []) {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return await db.all(sql, params);
}

async function transaction(fn) {
  await run('BEGIN');
  try {
    const result = await fn();
    await run('COMMIT');
    return result;
  } catch (err) {
    await run('ROLLBACK');
    throw err;
  }
}

async function close() {
  if (db) {
    await db.close();
    db = null;
  }
}

module.exports = {
  inicializar,
  run,
  get,
  all,
  transaction,
  close,
  isReady: () => db !== null
};
