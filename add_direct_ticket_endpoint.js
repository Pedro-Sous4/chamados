const fs = require('fs');
let c = fs.readFileSync('c:/chamados/site/server.js', 'utf-8');

const newEndpoint = `  'POST /api/tickets/direct': (req, res) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (!data.telefone) return sendJson(res, 400, { error: 'Telefone é obrigatório' });
        
        const ticketsPath = require('path').join(DADOS_DIR, 'tickets.json');
        let tickets = readCollection('tickets');
        const newId = tickets.length > 0 ? Math.max(...tickets.map(t => Number(t.id))) + 1 : 1;
        
        const newTicket = {
          id: String(newId),
          status: 'em_atendimento',
          origem: 'bot',
          number: data.telefone,
          name: data.nome || 'Usuário',
          solicitanteNome: data.nome || 'Usuário',
          type: 'Mensagem Direta',
          description: 'Atendimento direto iniciado via Organograma.',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          conversa: []
        };
        
        tickets.push(newTicket);
        fs.writeFileSync(ticketsPath, JSON.stringify(tickets, null, 2), 'utf-8');
        
        // Pause the bot (set to em_atendimento)
        const WEBHOOK_PORT = process.env.WEBHOOK_PORT || 3000;
        const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';
        const payload = JSON.stringify({ secret: WEBHOOK_SECRET, telefone: data.telefone, id: newTicket.id, tipo: 'Mensagem Direta', atendente: 'Organograma' });
        
        const whReq = require('http').request(
          { hostname: 'localhost', port: WEBHOOK_PORT, path: '/webhook/chamado-assumido', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } },
          (whRes) => { whRes.resume(); console.log(\`[site] webhook assumido direto: \${whRes.statusCode}\`); }
        );
        whReq.on('error', (e) => console.warn('[site] webhook indisponível:', e.message));
        whReq.write(payload);
        whReq.end();

        return sendJson(res, 200, { ok: true, ticketId: newTicket.id });
      } catch (e) {
        return sendJson(res, 400, { error: 'Invalid JSON' });
      }
    });
  },
`;

c = c.replace(/'POST \/api\/tickets': \(req, res\) => \{/, newEndpoint + "\n  'POST /api/tickets': (req, res) => {");
fs.writeFileSync('c:/chamados/site/server.js', c, 'utf-8');
console.log('Added /api/tickets/direct');
