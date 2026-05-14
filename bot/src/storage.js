const fs = require('fs');
const path = require('path');

// Pasta de dados fora da pasta do bot (workspace chamados/dados/)
const BASE_DIR = path.resolve(__dirname, '..', '..', 'dados');

/**
 * Retorna o caminho completo do arquivo JSON de uma coleção.
 * @param {string} collection - Nome da coleção (ex: 'tickets', 'logs')
 * @returns {string}
 */
function collectionPath(collection) {
  return path.join(BASE_DIR, `${collection}.json`);
}

/**
 * Garante que o diretório base e o arquivo da coleção existam.
 * @param {string} collection
 * @returns {string} caminho do arquivo
 */
function ensureCollection(collection) {
  if (!fs.existsSync(BASE_DIR)) {
    fs.mkdirSync(BASE_DIR, { recursive: true });
  }
  const filePath = collectionPath(collection);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2), 'utf-8');
  }
  return filePath;
}

/**
 * Lê todos os registros de uma coleção.
 * @param {string} collection
 * @returns {Array<object>}
 */
function readAll(collection) {
  const filePath = ensureCollection(collection);
  const raw = fs.readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, '');
  return JSON.parse(raw);
}

/**
 * Insere um novo registro em uma coleção.
 * Adiciona automaticamente `id` (timestamp) e `createdAt`.
 * @param {string} collection
 * @param {object} record
 * @returns {object} registro salvo
 */
function insert(collection, record) {
  const filePath = ensureCollection(collection);
  const records = readAll(collection);
  const saved = { id: Date.now(), createdAt: new Date().toISOString(), ...record };
  records.push(saved);
  fs.writeFileSync(filePath, JSON.stringify(records, null, 2), 'utf-8');
  return saved;
}

/**
 * Busca registros de uma coleção com filtro opcional.
 * @param {string} collection
 * @param {(record: object) => boolean} [predicate]
 * @returns {Array<object>}
 */
function find(collection, predicate) {
  const records = readAll(collection);
  return predicate ? records.filter(predicate) : records;
}

/**
 * Insere ou atualiza um registro baseado em um campo chave.
 * Se existir um registro onde record[keyField] === value, atualiza; caso contrário insere.
 * @param {string} collection
 * @param {string} keyField
 * @param {*} keyValue
 * @param {object} data - campos a inserir/atualizar
 * @returns {object} registro salvo
 */
function upsert(collection, keyField, keyValue, data) {
  const filePath = ensureCollection(collection);
  const records = readAll(collection);
  const idx = records.findIndex(r => String(r[keyField]) === String(keyValue));
  if (idx >= 0) {
    records[idx] = { ...records[idx], ...data, updatedAt: new Date().toISOString() };
    fs.writeFileSync(filePath, JSON.stringify(records, null, 2), 'utf-8');
    return records[idx];
  }
  const saved = { id: Date.now(), createdAt: new Date().toISOString(), ...data };
  records.push(saved);
  fs.writeFileSync(filePath, JSON.stringify(records, null, 2), 'utf-8');
  return saved;
}

module.exports = { insert, find, readAll, upsert };
