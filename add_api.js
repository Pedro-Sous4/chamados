const fs = require('fs');
let c = fs.readFileSync('c:/chamados/site/server.js', 'utf-8');

const append = `  'POST /api/bot/broadcast': (req, res) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      let data;
      try { data = JSON.parse(Buffer.concat(chunks).toString('utf-8')); } catch { return sendJson(res, 400, { error: 'JSON inválido' }); }
      if (!data.telefones || !data.mensagem) return sendJson(res, 400, { error: 'Faltam dados' });
      
      const telefones = data.telefones;
      let count = 0;
      telefones.forEach(tel => {
        const payload = JSON.stringify({ secret: process.env.WEBHOOK_SECRET || '', telefone: tel, mensagem: data.mensagem });
        const whReq = require('http').request(
          { hostname: 'localhost', port: process.env.WEBHOOK_PORT || 3000, path: '/webhook/mensagem-direta', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } },
          (whRes) => { whRes.resume(); }
        );
        whReq.on('error', () => {});
        whReq.write(payload);
        whReq.end();
        count++;
      });
      sendJson(res, 200, { ok: true, count });
    });
  },`;

c = c.replace(/'POST \/api\/colaboradores':/, append + '\n\n  \'POST /api/colaboradores\':');

fs.writeFileSync('c:/chamados/site/server.js', c, 'utf-8');
console.log('Added broadcast API');
