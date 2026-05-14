const http = require('http');
const { sendToUser, sendFileToUser } = require('./context');

const WEBHOOK_PORT = process.env.WEBHOOK_PORT || 3000;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';


/**
 * Inicia o servidor HTTP que recebe notificações do sistema externo.
 *
 * Endpoint:  POST /webhook/chamado-concluido
 * Body JSON: { "telefone": "5511999999999", "secret": "..." }
 */
const ALLOWED_URLS = ['/webhook/chamado-concluido', '/webhook/chamado-assumido', '/webhook/logout', '/webhook/mensagem-avulsa'];

function startWebhook() {
  const server = http.createServer((req, res) => {
    if (req.method !== 'POST' || !ALLOWED_URLS.includes(req.url)) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    const endpoint = req.url;
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      let data;
      try {
        data = JSON.parse(body || '{}');
      } catch {
        res.writeHead(400);
        res.end('JSON inválido');
        return;
      }

      // Valida secret se configurado
      if (WEBHOOK_SECRET && data.secret !== WEBHOOK_SECRET) {
        res.writeHead(401);
        res.end('Não autorizado');
        return;
      }

      // Rota de Logout
      if (endpoint === '/webhook/logout') {
        const client = require('./context').getClient();
        if (client && typeof client.logout === 'function') {
          try {
            await client.logout();
            console.log('[webhook] comando logout recebido e executado');
            res.writeHead(200);
            res.end('Logout efetuado');
            return;
          } catch (err) {
            console.error('[webhook] erro ao fazer logout:', err.message);
            res.writeHead(500);
            res.end('Erro ao desvincular');
            return;
          }
        }
        res.writeHead(400);
        res.end('Bot não disponível para logout');
        return;
      }

      const telefone = data.telefone;
      if (!telefone) {
        res.writeHead(400);
        res.end('Campo "telefone" obrigatório');
        return;
      }

      // Formata o userId no padrão do WhatsApp, preservando @c.us ou @lid
      const userId = (telefone.includes('@c.us') || telefone.includes('@lid'))
        ? telefone
        : `${telefone.replace(/\D/g, '')}@c.us`;

      let mensagem;

      if (endpoint === '/webhook/chamado-assumido') {
        const id        = data.id   || '—';
        const tipo      = data.tipo || data.type || '—';
        const atendente = data.atendente || '—';
        console.log(`[webhook] chamado assumido para ${userId}`);
        mensagem =
          `🔵 *Chamado Assumido*\n\n` +
          `*#${id}* — ${tipo}\n` +
          `👤 Assumido por: ${atendente}\n\n` +
          `Em breve você receberá o atendimento.`;
      } else if (endpoint === '/webhook/chamado-concluido') {
        const id   = data.id   || '—';
        const tipo = data.tipo || data.type || '—';
        const obs  = data.observacao || '';
        const anexo = data.anexo_solucao;
        console.log(`[webhook] chamado concluído para ${userId}`);
        mensagem =
          `✅ *Chamado Concluído*\n\n` +
          `*#${id}* — ${tipo}\n\n` +
          (obs ? `📝 *Observação do Técnico:*\n${obs}\n\n` : '') +
          `Caso precise de mais suporte, estamos à disposição.`;
          
        if (anexo) {
           try {
             await sendFileToUser(userId, anexo, 'solucao', mensagem);
             res.writeHead(200);
             res.end('Mensagem com anexo enviada');
             return;
           } catch(e) { 
             console.error('Erro ao enviar anexo da solução:', e.message);
             // Prossegue para tentar enviar ao menos o texto abaixo
           }
        }
      } else if (endpoint === '/webhook/mensagem-avulsa') {
        const id = data.id || '—';
        const obs = data.observacao || '';
        const anexo = data.anexo_solucao;
        const atendente = data.atendente || '—';
        console.log(`[webhook] mensagem avulsa para ${userId}`);
        mensagem = 
          `💬 *Atualização no Chamado #${id}*\n\n` +
          `*De:* ${atendente}\n\n` +
          `${obs}`;
          
        if (anexo) {
           try {
             await sendFileToUser(userId, anexo, 'anexo', mensagem);
             res.writeHead(200);
             res.end('Mensagem avulsa com anexo enviada');
             return;
           } catch(e) { 
             console.error('Erro ao enviar anexo avulso:', e.message);
             // Prossegue para tentar enviar ao menos o texto abaixo
           }
        }
      }

      try {
        await sendToUser(userId, mensagem);
        res.writeHead(200);
        res.end('Mensagem enviada');
      } catch (err) {
        console.error('[webhook] erro ao enviar mensagem:', err.message);
        res.writeHead(500);
        res.end('Erro ao enviar mensagem');
      }
    });
  });

  server.listen(WEBHOOK_PORT, () => {
    console.log(`[webhook] servidor rodando na porta ${WEBHOOK_PORT}`);
    console.log(`[webhook] endpoints disponíveis:`);
    console.log(`  POST http://localhost:${WEBHOOK_PORT}/webhook/chamado-concluido`);
    console.log(`  POST http://localhost:${WEBHOOK_PORT}/webhook/chamado-assumido`);
  });
}

module.exports = { startWebhook };
