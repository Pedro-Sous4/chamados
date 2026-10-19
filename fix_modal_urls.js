const fs = require('fs');
let c = fs.readFileSync('c:/chamados/org/laghetto-org-chart/src/components/Modal.jsx', 'utf-8');

c = c.replace(/window\.open\('http:\/\/localhost:9081\/\?openId='/g, "window.open('/dashboard.html?openId=");
c = c.replace(/window\.open\('http:\/\/localhost:9081\/dashboard\.html\?openId='/g, "window.open('/dashboard.html?openId=");
c = c.replace(/'http:\/\/localhost:9081\/api\/tickets\/direct'/g, "'/api/tickets/direct'");

fs.writeFileSync('c:/chamados/org/laghetto-org-chart/src/components/Modal.jsx', c, 'utf-8');
console.log('Fixed Modal URLs');
