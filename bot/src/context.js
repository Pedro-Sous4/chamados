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

  let activeId = userId;


  try {
    console.log(`[context:sendText] Enviando para ${activeId}: "${text.substring(0, 60)}..."`);
    const res = await _client.sendText(activeId, text);
    if (res && res.isSendFailure === true) {
      throw new Error(`isSendFailure: true`);
    }
    console.log(`[context:sendText] Sucesso ao enviar para ${activeId}. Retorno:`, JSON.stringify(res));
  } catch (err) {
    console.error(`[context:sendText] Erro ao enviar para ${activeId}:`, err.message || err);
    const errMsg = (err.message || '').toLowerCase();
    if (errMsg.includes('no lid') || errMsg.includes('not found') || errMsg.includes('invalid jid') || errMsg.includes('sendfailure') || activeId.includes('@lid')) {
      console.warn(`[context:sendText] Problema de ID (${activeId}), tentando resolver…`);
      try {
        const status = await _client.checkNumberStatus(activeId);
        const resolvedId = (status && status.id && status.id._serialized) || activeId;
        if (resolvedId !== activeId) {
          console.log(`[context:sendText] ID resolvido: ${activeId} -> ${resolvedId}`);
          console.log(`[context:sendText] Tentando reenviar para ID resolvido ${resolvedId}...`);
          const res2 = await _client.sendText(resolvedId, text);
          console.log(`[context:sendText] Sucesso ao reenviar para ${resolvedId}. Retorno:`, JSON.stringify(res2));
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

  let activeId = userId;


  const doSend = async (id) => {
    const ext = fileName.split('.').pop().toLowerCase();
    const isAudio = ['mp3', 'ogg', 'wav', 'm4a', 'oga', 'amr', 'webm'].includes(ext);
    if (isAudio) {
       console.log(`[context] Enviando áudio (PTT) para ${id}`);
       return await _client.sendPtt(id, filePath, fileName);
    }
    return await _client.sendFile(id, filePath, fileName, caption);
  };

  try {
    const res = await doSend(activeId);
    if (res && res.isSendFailure === true) {
      throw new Error(`isSendFailure: true`);
    }
  } catch (err) {
    const errMsg = (err.message || '').toLowerCase();
    if (errMsg.includes('no lid') || errMsg.includes('not found') || errMsg.includes('invalid jid') || errMsg.includes('sendfailure') || activeId.includes('@lid')) {
      console.warn(`[context:sendFile] Problema de ID (${activeId}), tentando resolver…`);
      try {
        const status = await _client.checkNumberStatus(activeId);
        const resolvedId = (status && status.id && status.id._serialized) || activeId;
        if (resolvedId !== activeId) {
          console.log(`[context:sendFile] ID resolvido: ${activeId} -> ${resolvedId}`);
          const res2 = await doSend(resolvedId);
          if (res2 && res2.isSendFailure === true) {
            throw new Error(`isSendFailure: true on retry`);
          }
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
