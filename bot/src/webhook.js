const http = require('http');
const path = require('path');
const { sendToUser, sendFileToUser } = require('./context');
const { updateSession, resetSession, findSessionId } = require('./sessions');

const WEBHOOK_PORT = process.env.WEBHOOK_PORT || 3000;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';


/**
 * Inicia o servidor HTTP que recebe notificaÃ§Ãµes do sistema externo.
 *
 * Endpoint:  POST /webhook/chamado-concluido
 * Body JSON: { "telefone": "5511999999999", "secret": "..." }
 */
const ALLOWED_URLS = ['/webhook/chamado-concluido', '/webhook/chamado-assumido', '/webhook/logout', '/webhook/mensagem-avulsa', '/webhook/import-contacts', '/webhook/mensagem-direta'];

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
        res.end('JSON invÃ¡lido');
        return;
      }

      // Valida secret se configurado
      if (WEBHOOK_SECRET && data.secret !== WEBHOOK_SECRET) {
        res.writeHead(401);
        res.end('NÃ£o autorizado');
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
        res.end('Bot nÃ£o disponÃ­vel para logout');
        return;
      }
 
      // Rota de ImportaÃ§Ã£o de Contatos
      if (endpoint === '/webhook/import-contacts') {
        const client = require('./context').getClient();
        if (!client) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'SessÃ£o do WhatsApp nÃ£o ativa' }));
          return;
        }
        try {
          const wppContacts = await client.getAllContacts();
          const storage = require('./storage');
          let contatos = storage.readAll('contatos');
          let importedCount = 0;

          wppContacts.forEach(wc => {
            if (!wc.id || !wc.id.user) return;
            const num = wc.id.user;
            // Ignora grupos e outros identificadores nÃ£o numÃ©ricos
            if (!/^\d+$/.test(num)) return;
            
            // Pega o nome mais qualificado disponÃ­vel
            const nome = wc.name || wc.formattedName || wc.pushname || '';
            if (!nome) return;

            const idx = contatos.findIndex(c => String(c.numero).replace(/\D/g, '') === num);
            if (idx === -1) {
              contatos.push({
                id: Date.now() + Math.floor(Math.random() * 1000),
                createdAt: new Date().toISOString(),
                numero: num,
                nome: nome
              });
              importedCount++;
            } else if (!contatos[idx].nome) {
              contatos[idx].nome = nome;
              contatos[idx].updatedAt = new Date().toISOString();
              importedCount++;
            }
          });

          if (importedCount > 0) {
            const fs = require('fs');
            const path = require('path');
            const contatosPath = path.resolve(__dirname, '..', '..', 'dados', 'contatos.json');
            fs.writeFileSync(contatosPath, JSON.stringify(contatos, null, 2), 'utf-8');
          }

          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: true, imported: importedCount }));
          return;
        } catch (err) {
          console.error('[webhook] erro ao importar contatos:', err.message);
          res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: err.message }));
          return;
        }
      }

      const telefone = data.telefone;
      if (!telefone) {
        res.writeHead(400);
        res.end('Campo "telefone" obrigatÃ³rio');
        return;
      }

      // Formata o userId no padrÃ£o do WhatsApp, resolvendo conflitos @lid/@c.us
      const userId = findSessionId(telefone);
      console.log(`[webhook] Resolvido userId: ${userId} (entrada: ${telefone})`);

      let mensagem;

      if (endpoint === '/webhook/chamado-assumido') {
        const id        = data.id   || 'â€”';
        const tipo      = data.tipo || data.type || 'â€”';
        const atendente = data.atendente || 'â€”';
        console.log(`[webhook] chamado assumido para ${userId}`);
        mensagem =
          `ðŸ”µ *Chamado Assumido*\n\n` +
          `*#${id}* â€” ${tipo}\n` +
          `ðŸ‘¤ Assumido por: ${atendente}\n\n` +
          `Em breve vocÃª receberÃ¡ o atendimento.`;
          
        // Sincroniza estado do bot para Chat Direto
        updateSession(userId, { state: 'em_atendimento', targetTicketId: id });
      } else if (endpoint === '/webhook/chamado-concluido') {
        const id   = data.id   || 'â€”';
        const tipo = data.tipo || data.type || 'â€”';
        const obs  = data.observacao || '';
        const anexo = data.anexo_solucao;
        console.log(`[webhook] chamado concluÃ­do para ${userId}`);
        mensagem =
          `âœ… *Chamado ConcluÃ­do*\n\n` +
          `*#${id}* â€” ${tipo}\n\n` +
          (obs ? `ðŸ“ *ObservaÃ§Ã£o do TÃ©cnico:*\n${obs}\n\n` : '') +
          `Caso precise de mais suporte, estamos Ã  disposiÃ§Ã£o.`;
          
        if (anexo) {
           try {
             await sendFileToUser(userId, anexo, path.basename(anexo), mensagem);
             res.writeHead(200);
             res.end('Mensagem com anexo enviada');
             return;
           } catch(e) { 
             console.error('Erro ao enviar anexo da soluÃ§Ã£o:', e.message);
             // Prossegue para tentar enviar ao menos o texto abaixo
           }
        }
      } else if (endpoint === '/webhook/mensagem-direta') {
        console.log('[webhook] mensagem direta para', userId);
        mensagem = data.mensagem || '';
      } else if (endpoint === '/webhook/mensagem-avulsa') {
        const id = data.id || 'â€”';
        const obs = data.observacao || '';
        const anexo = data.anexo_solucao;
        const atendente = data.atendente || 'â€”';
        console.log(`[webhook] mensagem avulsa para ${userId}`);
        mensagem = 
          `ðŸ’¬ *AtualizaÃ§Ã£o no Chamado #${id}*\n\n` +
          `*De:* ${atendente}\n\n` +
          `${obs}`;
          
        // Se o chamado foi atualizado, garantimos que o usuÃ¡rio estÃ¡ no modo chat
        updateSession(userId, { state: 'em_atendimento', targetTicketId: id });
          
        if (anexo) {
           try {
             await sendFileToUser(userId, anexo, path.basename(anexo), mensagem);
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
        
        // Se for conclusÃ£o, reseta a sessÃ£o apÃ³s enviar a mensagem
        if (endpoint === '/webhook/chamado-concluido') {
           resetSession(userId);
        }

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
    console.log(`[webhook] endpoints disponÃ­veis:`);
    console.log(`  POST http://localhost:${WEBHOOK_PORT}/webhook/chamado-concluido`);
    console.log(`  POST http://localhost:${WEBHOOK_PORT}/webhook/chamado-assumido`);
  });
}

module.exports = { startWebhook };

