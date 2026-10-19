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
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Limpa processos zumbis do Chrome e arquivos de trava (locks) que causam crash loop no PM2
try {
  console.log('[Bot] Limpando processos Chrome anteriores e arquivos de trava...');
  execSync(`powershell -Command "Get-CimInstance Win32_Process | Where-Object { $_.Name -like '*chrom*' -and $_.CommandLine -like '*wpp-bot-session*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"`);
} catch (e) {
  console.warn('[Bot] Erro ao limpar processos Chrome:', e.message);
}

const sessionDir = path.resolve(__dirname, '..', 'tokens', 'wpp-bot-session-v16');
const lockFiles = ['SingletonLock', 'SingletonCookie', 'SingletonSocket'];
lockFiles.forEach(file => {
  const filePath = path.join(sessionDir, file);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`[Bot] Trava removida: ${file}`);
    } catch (e) {
      console.warn(`[Bot] Não foi possível remover ${file}:`, e.message);
    }
  }
});

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
const userTimeouts = new Map();
const pendingBatches = new Map();

function start(client) {
  client.onMessage(async (message) => {
    const from = message.from || 'desconhecido';
    
    // Filtros básicos
    if (message.fromMe) return; 
    if (message.isGroupMsg || from === 'status@broadcast' || from.endsWith('@newsletter')) return;

    // Aceita apenas @c.us ou @lid
    if (!from.endsWith('@c.us') && !from.endsWith('@lid')) return;

    // Ignora se não tiver conteúdo útil
    const isMediaMsg = message.isMedia || ['image', 'document', 'video', 'audio', 'ptt'].includes(message.type);
    if (!isMediaMsg && (!message.body || !message.body.trim())) return;

    console.log(`[bot] Mensagem recebida de ${from}: "${message.body || '(mídia)'}"`);

    // Inicializa batch temporário para o usuário
    if (!pendingBatches.has(from)) {
      pendingBatches.set(from, []);
    }
    pendingBatches.get(from).push(message);

    // Limpa timeout existente para renovar a janela de 1.5 segundos
    if (userTimeouts.has(from)) {
      clearTimeout(userTimeouts.get(from));
    }

    const timeoutId = setTimeout(() => {
      userTimeouts.delete(from);
      const batch = pendingBatches.get(from) || [];
      pendingBatches.delete(from);

      if (batch.length === 0) return;

      // Adiciona o processamento do lote à fila sequencial do usuário
      if (!queues.has(from)) {
        queues.set(from, Promise.resolve());
      }

      queues.set(from, queues.get(from).then(async () => {
        try {
          if (batch.length === 1) {
            await handleMessage(client, batch[0]);
          } else {
            // Unifica mensagens do lote
            // Encontra a primeira com texto (ou acumula)
            const textMsgs = batch.filter(m => m.body && m.body.trim() && !m.isMedia && !['image', 'document', 'video', 'audio', 'ptt'].includes(m.type));
            const mainMessage = batch.find(m => m.body && m.body.trim()) || batch[0];
            
            // Reúne todas as mídias do lote
            const mediaBatch = batch.filter(m => m.isMedia || ['image', 'document', 'video', 'audio', 'ptt'].includes(m.type) || !!m.mimetype);
            
            // Modifica o mainMessage para carregar o mediaBatch e marcar que é mídia se houver
            mainMessage.mediaBatch = mediaBatch;
            if (mediaBatch.length > 0) {
              mainMessage.isMedia = true;
              if (textMsgs.length > 0) {
                mainMessage.body = textMsgs.map(m => m.body.trim()).join('\n');
              }
            }
            
            await handleMessage(client, mainMessage);
          }
        } catch (err) {
          console.error(`[erro] na fila de ${from}:`, err.message);
        }
      }));
    }, 1500);

    userTimeouts.set(from, timeoutId);
  });
}
