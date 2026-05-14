/**
 * context.js — motor de envio de mensagens.
 *
 * Centraliza quem é o "client" ativo e como entregar mensagens,
 * sem que os outros módulos precisem saber se estão no modo
 * wppconnect (normal) ou emulador (--off).
 *
 * Modo normal  → sendToUser chama o client.sendText do wppconnect.
 * Modo --off   → sendToUser publica via SSE para o browser.
 *
 * O seletor é automático: se houver streams SSE registradas para
 * aquele userId, usa SSE; caso contrário usa o client real.
 */

// ── Client ────────────────────────────────────────────────────────────────────
let _client = null;

function setClient(client) {
  _client = client;
}

function getClient() {
  return _client;
}

// ── SSE streams ───────────────────────────────────────────────────────────────
// Map<userId, Set<writeFn>>  —  cada browser registra uma função de escrita
const _streams = new Map();

function addSSEStream(userId, writeFn) {
  if (!_streams.has(userId)) _streams.set(userId, new Set());
  _streams.get(userId).add(writeFn);
}

function removeSSEStream(userId, writeFn) {
  const set = _streams.get(userId);
  if (!set) return;
  set.delete(writeFn);
  if (set.size === 0) _streams.delete(userId);
}

function pushToSSE(userId, text) {
  const set = _streams.get(userId);
  if (set) set.forEach((fn) => fn(text));
}

// ── Envio inteligente ─────────────────────────────────────────────────────────
/**
 * Envia `text` para `userId`.
 * Roteia automaticamente para SSE (emulador) ou wppconnect (normal).
 */
async function sendToUser(userId, text) {
  // Emulator mode: SSE subscribers existem para este usuário
  const set = _streams.get(userId);
  if (set && set.size > 0) {
    pushToSSE(userId, text);
    return;
  }

  // Normal mode: client real (wppconnect)
  if (!_client) {
    console.warn('[context] cliente não está pronto — mensagem descartada para', userId);
    return;
  }

  try {
    await _client.sendText(userId, text);
  } catch (err) {
    const errMsg = (err.message || '').toLowerCase();
    if (errMsg.includes('no lid') || errMsg.includes('not found') || errMsg.includes('invalid jid')) {
      console.warn(`[context:sendText] Problema de ID (${userId}), tentando resolver…`);
      try {
        const status = await _client.checkNumberStatus(userId);
        const resolvedId = (status && status.id && status.id._serialized) || userId;
        if (resolvedId !== userId) {
          console.log(`[context:sendText] ID resolvido: ${userId} -> ${resolvedId}`);
          await _client.sendText(resolvedId, text);
          return;
        }
      } catch (e) {
        console.error('[context:sendText] Falha ao resolver ID:', e.message);
      }
    }
    throw err;
  }
}

/**
 * Envia arquivo com tratamento de LID.
 */
async function sendFileToUser(userId, filePath, fileName, caption = '') {
  if (!_client) {
    console.warn('[context] cliente não está pronto — anexo descartado para', userId);
    return;
  }

  const doSend = async (id) => {
    return await _client.sendFile(id, filePath, fileName, caption);
  };

  try {
    await doSend(userId);
  } catch (err) {
    const errMsg = (err.message || '').toLowerCase();
    if (errMsg.includes('no lid') || errMsg.includes('not found') || errMsg.includes('invalid jid')) {
      console.warn(`[context:sendFile] Problema de ID (${userId}), tentando resolver…`);
      try {
        const status = await _client.checkNumberStatus(userId);
        const resolvedId = (status && status.id && status.id._serialized) || userId;
        if (resolvedId !== userId) {
          console.log(`[context:sendFile] ID resolvido: ${userId} -> ${resolvedId}`);
          await doSend(resolvedId);
          return;
        }
      } catch (e) {
        console.error('[context:sendFile] Falha ao resolver ID:', e.message);
      }
    }
    throw err;
  }
}

module.exports = { setClient, getClient, addSSEStream, removeSSEStream, pushToSSE, sendToUser, sendFileToUser };
