const fs = require('fs');
let c = fs.readFileSync('c:/chamados/org/laghetto-org-chart/src/components/Modal.jsx', 'utf-8');

c = c.replace(/window\.open\('\/dashboard\.html\?openId= \+ data\.ticketId, '_blank'\);/, "window.open('/dashboard.html?openId=' + data.ticketId, '_blank');");

fs.writeFileSync('c:/chamados/org/laghetto-org-chart/src/components/Modal.jsx', c, 'utf-8');
console.log('Fixed quote in Modal.jsx');
