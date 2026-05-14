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
    // Trata o erro "No LID for user" específico do wppconnect
    if (err.message && err.message.toLowerCase().includes('no lid')) {
      console.warn('[context] LID não encontrado, resolvendo número…');
      const status = await _client.checkNumberStatus(userId);
      const resolvedId = (status && status.id && status.id._serialized) || userId;
      await _client.sendText(resolvedId, text);
    } else {
      throw err;
    }
  }
}

module.exports = { setClient, getClient, addSSEStream, removeSSEStream, pushToSSE, sendToUser };
