const fs = require('fs');

let m = fs.readFileSync('c:/chamados/org/laghetto-org-chart/src/components/Modal.jsx', 'utf-8');
m = m.replace(/const myTickets = tickets\.filter\(t => \{\s*if \(t\.status === 'concluido' \|\| t\.status === 'cancelado'\) return false;/, 
`const myTickets = tickets.filter(t => {`);
fs.writeFileSync('c:/chamados/org/laghetto-org-chart/src/components/Modal.jsx', m, 'utf-8');
console.log('Fixed Modal filtering');
