const fs = require('fs');
let c = fs.readFileSync('c:/chamados/org/laghetto-org-chart/src/components/Modal.jsx', 'utf-8');
c = c.replace(/\\\`/g, '`').replace(/\\\$/g, '$');
fs.writeFileSync('c:/chamados/org/laghetto-org-chart/src/components/Modal.jsx', c, 'utf-8');
