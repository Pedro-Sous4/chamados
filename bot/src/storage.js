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

/**
 * Salva todos os registros de uma coleção (sobrescreve o arquivo).
 * @param {string} collection
 * @param {Array<object>} records
 */
function saveAll(collection, records) {
  const filePath = collectionPath(collection);
  const lockPath = path.join(BASE_DIR, `${collection}.lock`);
  
  let retries = 0;
  while (fs.existsSync(lockPath) && retries < 15) {
    retries++;
    const end = Date.now() + 40;
    while (Date.now() < end) {}
  }

  try {
    fs.writeFileSync(lockPath, 'lock', 'utf-8');
    
    // Se for a coleção de tickets, tenta um merge simples se o arquivo mudou no disco
    if (collection === 'tickets') {
       try {
          const onDisk = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          // Merge: se o registro no disco tiver mensagens que não temos localmente, adiciona
          records.forEach((localT, i) => {
             const diskT = onDisk.find(d => d.id === localT.id);
             if (diskT && diskT.conversa && diskT.conversa.length > (localT.conversa ? localT.conversa.length : 0)) {
                // O disco tem mais mensagens (provavelmente do técnico via dashboard)
                // Adiciona as novas mensagens do técnico ao nosso registro local antes de salvar
                if (!localT.conversa) localT.conversa = [];
                const localLen = localT.conversa.length;
                diskT.conversa.slice(localLen).forEach(msg => {
                   if (msg.role === 'technician') localT.conversa.push(msg);
                });
                // Também atualiza a observação se mudou
                if (diskT.observacao) localT.observacao = diskT.observacao;
             }
          });
       } catch(e) {}
    }

    fs.writeFileSync(filePath, JSON.stringify(records, null, 2), 'utf-8');
  } finally {
    if (fs.existsSync(lockPath)) fs.unlinkSync(lockPath);
  }
}

module.exports = { insert, find, readAll, upsert, saveAll };
