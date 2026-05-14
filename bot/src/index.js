require('dotenv').config();

process.on('uncaughtException', (err) => {
  console.error('[FATAL uncaughtException]', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[FATAL unhandledRejection]', reason);
});

// ── Modo emulador: npm start -- --off ────────────────────────────────────────
if (process.argv.includes('--off')) {
  const { startEmulator } = require('./emulator');
  startEmulator();
  return;
}

// ── Modo normal: wppconnect ──────────────────────────────────────────────────
const wppconnect = require('@wppconnect-team/wppconnect');
const { handleMessage } = require('./bot');
const { startWebhook } = require('./webhook');
const { setClient } = require('./context');
const http = require('http');

function reportStatus(status, qr = null, numero = null) {
  const data = JSON.stringify({ status, qr, numero });
  const options = {
    hostname: 'localhost',
    port: process.env.SITE_PORT || 9081,
    path: '/api/config/whatsapp/status',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };
  const req = http.request(options).on('error', () => {});
  req.write(data);
  req.end();
}

wppconnect
  .create({
    session: 'wpp-bot-session-v16',
    catchQR: (base64Qr, asciiQR) => {
      console.log('\n=== ESCANEIE O QR CODE ABAIXO NO SEU WHATSAPP ===\n');
      console.log(asciiQR);
      reportStatus('waiting_qr', base64Qr);
    },
    statusFind: (statusSession) => {
      console.log('[Status]', statusSession);
      const connectedStatuses = ['isLogged', 'qrReadSuccess', 'chatAvailable', 'inChat', 'SUCCESS'];
      if (connectedStatuses.includes(statusSession)) {
        // Ignora reportar esses status diretamente para não sobrescrever o 'connected' 
        // enviado no .then(), que contém o número do celular.
        return; 
      }
      reportStatus(statusSession);
    },
    headless: true,
    logQR: true,
    autoClose: 0,
  })
  .then(async (client) => {
    console.log('[Bot] Conectado com sucesso!');
    
    // Descobre o próprio número para sincronizar com o site
    let myNumber = '';
    try {
      const wid = await client.getWid();
      myNumber = wid ? wid.replace(/\D/g, '') : '';
    } catch {}

    reportStatus('connected', null, myNumber);
    setClient(client);
    startWebhook();
    start(client);
  })
  .catch((err) => {
    console.error('[Erro ao iniciar]', err);
  });

// Fila de processamento por usuário para garantir ordem e evitar mensagens ignoradas
const queues = new Map();

function start(client) {
  client.onMessage(async (message) => {
    const from = message.from || 'desconhecido';
    
    // Filtros básicos
    if (message.fromMe) return; 
    if (message.isGroupMsg || from === 'status@broadcast' || from.endsWith('@newsletter')) return;

    // Aceita apenas @c.us ou @lid
    if (!from.endsWith('@c.us') && !from.endsWith('@lid')) return;

    // Ignora se não tiver conteúdo útil
    const isMediaMsg = message.isMedia || ['image', 'document', 'video', 'audio'].includes(message.type);
    if (!isMediaMsg && (!message.body || !message.body.trim())) return;

    console.log(`[bot] Mensagem recebida de ${from}: "${message.body || '(mídia)'}"`);

    // Adiciona à fila do usuário
    if (!queues.has(from)) {
      queues.set(from, Promise.resolve());
    }

    queues.set(from, queues.get(from).then(async () => {
      try {
        await handleMessage(client, message);
      } catch (err) {
        console.error(`[erro] na fila de ${from}:`, err.message);
      }
    }));
  });
}
