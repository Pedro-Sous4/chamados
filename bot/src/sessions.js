/**
 * Gerencia o estado de cada conversa em memória.
 * Cada sessão é indexada pelo número do usuário.
 *
 * Estados possíveis:
 *  - 'idle'                   → aguardando primeira mensagem
 *  - 'aguardando_nome'        → aguardando o nome do solicitante
 *  - 'aguardando_categoria'   → aguardando escolha: 1-Acessos / 2-Outro
 *  - 'aguardando_sistema_acesso' → aguardando escolha do sistema (1-12)
 *  - 'aguardando_descricao'   → aguardando descrição do problema
 *  - 'chamado_criado'         → chamado registrado, aguarda nova mensagem
 */

const sessions = {};

/**
 * Retorna a sessão do usuário. Cria uma nova se não existir.
 * @param {string} userId - número do WhatsApp (ex: "5511999999999@c.us")
 */
function getSession(userId) {
  if (!sessions[userId]) {
    sessions[userId] = {
      state: 'idle',
      type: null,
    };
  }
  return sessions[userId];
}

/**
 * Atualiza campos da sessão do usuário.
 * @param {string} userId
 * @param {object} data
 */
function updateSession(userId, data) {
  const session = getSession(userId);
  Object.assign(session, data);
}

/**
 * Reseta a sessão do usuário para o estado inicial.
 * @param {string} userId
 */
function resetSession(userId) {
  sessions[userId] = { state: 'idle', type: null };
}

module.exports = { getSession, updateSession, resetSession };
