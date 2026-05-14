/**
 * Modo emulador (--off).
 * Sobe um servidor HTTP local que serve uma pagina de chat simples.
 * As mensagens enviadas pelo browser passam pelo mesmo handleMessage do bot.
 * Notificacoes assincronas (webhooks externos) chegam via SSE ao browser.
 *
 * O roteamento de envio e controlado por context.js - nenhum outro modulo
 * precisa saber qual modo esta ativo.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { handleMessage } = require('./bot');
const { startWebhook } = require('./webhook');
const context = require('./context');

const PORT = process.env.EMULATOR_PORT || 4000;
const HTML = fs.readFileSync(path.join(__dirname, 'emulator.html'), 'utf8');

// Respostas sincronas coletadas durante um /send ativo
let _responseCollector = null;

// Cliente falso - bot.js chama client.sendText; aqui decidimos o destino:
// se ha um /send ativo -> lista de respostas retornadas ao browser via JSON
// caso contrario (notificacao de webhook) -> SSE para o browser
const fakeClient = {
  async sendText(userId, text) {
    if (_responseCollector) {
      _responseCollector.push(text);
    } else {
      context.pushToSSE(userId, text);
    }
  },
  async checkNumberStatus(userId) {
    return { id: { _serialized: userId } };
  },
};

function startEmulator() {
  // Registra o cliente falso no contexto compartilhado
  context.setClient(fakeClient);
  startWebhook();

  const server = http.createServer((req, res) => {
    // Pagina principal
    if (req.method === 'GET' && req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(HTML);
      return;
    }

    // SSE: notificacoes assincronas (webhooks externos)
    // GET /events?phone=5511999999999
    if (req.method === 'GET' && req.url.startsWith('/events')) {
      const url = new URL(req.url, `http://localhost:${PORT}`);
      const phone = (url.searchParams.get('phone') || '').replace(/\D/g, '');
      if (!phone) {
        res.writeHead(400);
        res.end('phone obrigatorio');
        return;
      }

      const userId = `${phone}@c.us`;

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });
      res.write(':ok\n\n');

      const writeFn = (text) => {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      };

      context.addSSEStream(userId, writeFn);

      req.on('close', () => {
        context.removeSSEStream(userId, writeFn);
      });

      return;
    }

    // Recebe mensagem do usuario e retorna respostas do bot
    if (req.method === 'POST' && req.url === '/send') {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', async () => {
        let payload;
        try {
          payload = JSON.parse(body);
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'JSON invalido' }));
          return;
        }

        const { name = 'Usuario', phone = '5500000000000', text = '' } = payload;
        const userId = phone.replace(/\D/g, '') + '@c.us';

        const responses = [];
        _responseCollector = responses;

        const fakeMessage = {
          from: userId,
          body: String(text),
          id: `emu_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          timestamp: Math.floor(Date.now() / 1000),
          fromMe: false,
          isGroupMsg: false,
          isMedia: false,
          type: 'chat',
          sender: { pushname: name },
        };

        try {
          await handleMessage(fakeClient, fakeMessage);
        } catch (err) {
          console.error('[emulator] erro ao processar mensagem:', err.message || err);
        } finally {
          _responseCollector = null;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ responses }));
      });
      return;
    }

    res.writeHead(404);
    res.end('Not found');
  });

  server.listen(PORT, () => {
    console.log(`[Emulador] Rodando em http://localhost:${PORT}`);
    console.log('[Emulador] Abra o link acima no Chrome para simular o WhatsApp.');
  });
}

module.exports = { startEmulator };
