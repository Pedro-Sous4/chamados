const fs = require('fs');
const path = require('path');

/**
 * Gerencia o estado de cada conversa.
 * Sessões são persistidas em dados/sessions_bot.json para sobreviver a reinícios.
 */

const SESSIONS_FILE = path.resolve(__dirname, '..', '..', 'dados', 'sessions_bot.json');

let sessions = {};

function loadSessions() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const data = fs.readFileSync(SESSIONS_FILE, 'utf-8');
      sessions = JSON.parse(data);
    }
  } catch (err) {
    console.error('[sessions] Erro ao carregar sessões:', err.message);
    sessions = {};
  }
}

function saveSessions() {
  try {
    const dir = path.dirname(SESSIONS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), 'utf-8');
  } catch (err) {
    console.error('[sessions] Erro ao salvar sessões:', err.message);
  }
}

// Carrega ao iniciar o módulo
loadSessions();

/**
 * Retorna a sessão do usuário. Cria uma nova se não existir.
 * @param {string} userId - número do WhatsApp (ex: "5511999999999@c.us")
 */
function getSession(userId) {
  if (!sessions[userId]) {
    sessions[userId] = {
      state: 'idle',
      type: null,
      anexos: []
    };
  }
  return sessions[userId];
}

/**
 * Atualiza campos da sessão do usuário e persiste.
 * @param {string} userId
 * @param {object} data
 */
function updateSession(userId, data) {
  const session = getSession(userId);
  Object.assign(session, data);
  saveSessions();
}

/**
 * Reseta a sessão do usuário para o estado inicial e persiste.
 * @param {string} userId
 */
function resetSession(userId) {
  sessions[userId] = { state: 'idle', type: null, anexos: [] };
  saveSessions();
}

/**
 * Procura o ID de sessão real (com @c.us ou @lid) a partir de um número ou ID parcial.
 * Cruza com sessions ativas, contatos.json e tickets.json para correlacionar telefone real e @lid.
 * @param {string} identifier 
 * @returns {string} ID completo encontrado ou o próprio identificador
 */
function findSessionId(identifier) {
  if (!identifier) return identifier;
  if (sessions[identifier]) return identifier;
  const clean = String(identifier).replace(/\D/g, '');
  if (!clean) return identifier;

  // 1. Busca direta por prefixo na lista de chaves de sessões
  const foundDirect = Object.keys(sessions).find(k => k.startsWith(clean));
  if (foundDirect) return foundDirect;

  // 2. Se for um número longo (LID) ou telefone, tenta achar em contatos e colaboradores
  try {
    const contatosFile = path.resolve(__dirname, '..', '..', 'dados', 'contatos.json');
    const colsFile = path.resolve(__dirname, '..', '..', 'dados', 'colaboradores.json');
    let matchedNames = new Set();

    if (fs.existsSync(contatosFile)) {
      const contatos = JSON.parse(fs.readFileSync(contatosFile, 'utf-8'));
      contatos.forEach(c => {
        const cNum = String(c.numero || '').replace(/\D/g, '');
        if (cNum === clean || (clean.length >= 8 && cNum.endsWith(clean.slice(-8))) || (cNum.length >= 8 && clean.endsWith(cNum.slice(-8)))) {
          if (c.nome) matchedNames.add(c.nome.toLowerCase().trim());
        }
      });
    }

    if (fs.existsSync(colsFile)) {
      const cols = JSON.parse(fs.readFileSync(colsFile, 'utf-8'));
      const root = Array.isArray(cols) ? cols[0] : cols;
      const allCols = [...(root?.lideranca || [])];
      const ext = (s) => { if (!s) return; s.forEach(x => { if (x.colaboradores) allCols.push(...x.colaboradores); if (x.subsetores) ext(x.subsetores); }); };
      ext(root?.setores);

      allCols.forEach(c => {
        const cNum = String(c.telefone || '').replace(/\D/g, '');
        if (cNum === clean || (clean.length >= 8 && cNum.endsWith(clean.slice(-8))) || (cNum.length >= 8 && clean.endsWith(cNum.slice(-8)))) {
          if (c.nome) matchedNames.add(c.nome.toLowerCase().trim());
        }
      });
    }

    if (matchedNames.size > 0 && fs.existsSync(contatosFile)) {
      const contatos = JSON.parse(fs.readFileSync(contatosFile, 'utf-8'));
      for (const ct of contatos) {
        const ctNome = String(ct.nome || '').toLowerCase().trim();
        for (const mName of matchedNames) {
          if (ctNome && (ctNome === mName || ctNome.includes(mName) || mName.includes(ctNome))) {
            const num = String(ct.numero || '').replace(/\D/g, '');
            if (num) {
              const kMatch = Object.keys(sessions).find(k => k.startsWith(num));
              if (kMatch) return kMatch;
            }
          }
        }
      }
    }
  } catch (e) {
    // Silencia erro de leitura auxiliar
  }

  return identifier.includes('@') ? identifier : `${identifier}@c.us`;
}

/**
 * Retorna todos os sessionIds conhecidos associados ao identificador (ex: @lid e @c.us)
 * @param {string} identifier
 * @returns {string[]}
 */
function findRelatedSessionIds(identifier) {
  const result = new Set();
  if (!identifier) return [];
  const primary = findSessionId(identifier);
  if (primary) result.add(primary);
  if (identifier.includes('@')) result.add(identifier);

  const clean = String(identifier).replace(/\D/g, '');
  if (clean) {
    Object.keys(sessions).forEach(k => {
      if (k.startsWith(clean)) result.add(k);
    });

    try {
      const contatosFile = path.resolve(__dirname, '..', '..', 'dados', 'contatos.json');
      const colsFile = path.resolve(__dirname, '..', '..', 'dados', 'colaboradores.json');
      let matchedNames = new Set();

      if (fs.existsSync(contatosFile)) {
        const contatos = JSON.parse(fs.readFileSync(contatosFile, 'utf-8'));
        contatos.forEach(c => {
          const cNum = String(c.numero || '').replace(/\D/g, '');
          if (cNum === clean || (clean.length >= 8 && cNum.endsWith(clean.slice(-8))) || (cNum.length >= 8 && clean.endsWith(cNum.slice(-8)))) {
            if (c.nome) matchedNames.add(c.nome.toLowerCase().trim());
          }
        });
      }

      if (fs.existsSync(colsFile)) {
        const cols = JSON.parse(fs.readFileSync(colsFile, 'utf-8'));
        const root = Array.isArray(cols) ? cols[0] : cols;
        const allCols = [...(root?.lideranca || [])];
        const ext = (s) => { if (!s) return; s.forEach(x => { if (x.colaboradores) allCols.push(...x.colaboradores); if (x.subsetores) ext(x.subsetores); }); };
        ext(root?.setores);

        allCols.forEach(c => {
          const cNum = String(c.telefone || '').replace(/\D/g, '');
          if (cNum === clean || (clean.length >= 8 && cNum.endsWith(clean.slice(-8))) || (cNum.length >= 8 && clean.endsWith(cNum.slice(-8)))) {
            if (c.nome) matchedNames.add(c.nome.toLowerCase().trim());
          }
        });
      }

      if (matchedNames.size > 0 && fs.existsSync(contatosFile)) {
        const contatos = JSON.parse(fs.readFileSync(contatosFile, 'utf-8'));
        contatos.forEach(c => {
          const ctNome = String(c.nome || '').toLowerCase().trim();
          for (const mName of matchedNames) {
            if (ctNome && (ctNome === mName || ctNome.includes(mName) || mName.includes(ctNome))) {
              const num = String(c.numero || '').replace(/\D/g, '');
              if (num) {
                Object.keys(sessions).forEach(k => {
                  if (k.startsWith(num)) result.add(k);
                });
                if (num.length >= 14) result.add(`${num}@lid`);
                else result.add(`${num}@c.us`);
              }
            }
          }
        });
      }
    } catch (e) {}
  }

  return Array.from(result);
}

module.exports = { getSession, updateSession, resetSession, findSessionId, findRelatedSessionIds };


