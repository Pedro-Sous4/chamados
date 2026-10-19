const fs = require('fs');

const serverFile = 'c:/chamados/site/server.js';
let serverCode = fs.readFileSync(serverFile, 'utf-8');

// Replace GET /api/tickets/:id implementation with full enrichment
const oldGetTicketRegex = /\/\/ Dynamic route: GET \/api\/tickets\/:id[\s\S]*?return sendJson\(res, 200, ticket\);\s*\}/;

const newGetTicket = `// Dynamic route: GET /api/tickets/:id
  const ticketIdMatch = /^GET \\/api\\/tickets\\/(\\d+)$/.exec(routeKey);
  if (ticketIdMatch) {
    const id = Number(ticketIdMatch[1]);
    const tickets = readCollection('tickets');
    let ticket = tickets.find(t => Number(t.id) === id);
    if (!ticket) return sendJson(res, 404, { error: 'Chamado não encontrado' });

    // Enriquecimento completo igual ao GET /api/tickets
    const contatos = readCollection('contatos');
    const colsData = readCollection('colaboradores');
    let allColaboradores = [];
    const root = Array.isArray(colsData) ? colsData[0] : colsData;
    if (root) {
      allColaboradores = [...(root.lideranca || [])];
      const extractDeep = (sectors) => {
        if (!sectors) return;
        sectors.forEach(s => {
          if (s.colaboradores) allColaboradores.push(...s.colaboradores);
          if (s.subsetores) extractDeep(s.subsetores);
        });
      };
      extractDeep(root.setores);
    }

    let realNumber = null;
    if (ticket.number) {
      const contato = contatos.find(c => String(c.numero).replace(/\\D/g, '') === String(ticket.number).replace(/\\D/g, ''));
      if (contato) {
        if (contato.nome) ticket = Object.assign({}, ticket, { name: contato.nome });
        if (contato.realNumber) realNumber = contato.realNumber;
      }
    }
    const sNome = ticket.solicitanteNome || ticket.name || ticket.solicitante;
    const sEmail = ticket.solicitanteEmail;

    let colabMatch = null;
    if (sEmail && sEmail !== '-') {
      colabMatch = allColaboradores.find(c => c.email && c.email.toLowerCase() === sEmail.toLowerCase());
    }
    if (!colabMatch && sNome && sNome !== '-' && sNome !== 'Bot') {
      colabMatch = allColaboradores.find(c => c.nome && c.nome.toLowerCase() === sNome.toLowerCase());
    }
    if (!colabMatch && (realNumber || ticket.number)) {
      colabMatch = allColaboradores.find(c => {
        if (!c.telefone) return false;
        const colabTel = String(c.telefone).replace(/\\D/g, '');
        const tReal = String(realNumber || '').replace(/\\D/g, '');
        const tNum = String(ticket.number || '').replace(/\\D/g, '');
        return colabTel && (colabTel === tReal || colabTel === tNum || tReal.endsWith(colabTel) || tNum.endsWith(colabTel));
      });
    }

    const enriched = Object.assign({}, ticket);
    if (realNumber) enriched.realNumber = realNumber;
    if (colabMatch) {
      enriched.foto = colabMatch.foto;
      enriched.cargo = colabMatch.cargo;
      enriched.colabSetor = colabMatch.setor;
      enriched.solicitanteNome = colabMatch.nome;
    }

    return sendJson(res, 200, enriched);
  }`;

serverCode = serverCode.replace(oldGetTicketRegex, newGetTicket);
fs.writeFileSync(serverFile, serverCode, 'utf-8');
console.log('Enriched GET /api/tickets/:id in server.js successfully!');
