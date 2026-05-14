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

module.exports = { getSession, updateSession, resetSession };
