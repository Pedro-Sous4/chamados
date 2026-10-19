const fs = require('fs');

let c = fs.readFileSync('c:/chamados/org/laghetto-org-chart/src/components/Card.jsx', 'utf-8');
c = c.replace(/const hasOpenTicket = tickets\.some\(t => \{[\s\S]*?\}\);/, `const hasOpenTicket = tickets.some(t => {
      if (t.status === 'concluido' || t.status === 'cancelado') return false;
      if (t.solicitanteNome && t.solicitanteNome.toLowerCase() === (colaborador.nome || '').toLowerCase()) return true;
      const colabTel = String(colaborador.telefone || '').replace(/\\D/g, '');
      const tNum = String(t.number || '').replace(/\\D/g, '');
      if (!colabTel || !tNum) return false;
      return tNum.endsWith(colabTel) || colabTel.endsWith(tNum);
  });`);
fs.writeFileSync('c:/chamados/org/laghetto-org-chart/src/components/Card.jsx', c, 'utf-8');

let m = fs.readFileSync('c:/chamados/org/laghetto-org-chart/src/components/Modal.jsx', 'utf-8');
m = m.replace(/const myTickets = tickets\.filter\(t => t\.status !== 'concluido' && t\.status !== 'cancelado' && colabTel && String\(t\.number \|\| ''\)\.replace\(\/\\D\/g, ''\)\.endsWith\(colabTel\)\);/, 
`const myTickets = tickets.filter(t => {
    if (t.status === 'concluido' || t.status === 'cancelado') return false;
    if (t.solicitanteNome && t.solicitanteNome.toLowerCase() === (colaborador.nome || '').toLowerCase()) return true;
    if (!colabTel) return false;
    const tNum = String(t.number || '').replace(/\\D/g, '');
    return tNum.endsWith(colabTel) || colabTel.endsWith(tNum);
  });`);
fs.writeFileSync('c:/chamados/org/laghetto-org-chart/src/components/Modal.jsx', m, 'utf-8');
console.log('Fixed matching logic');
