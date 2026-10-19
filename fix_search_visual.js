const fs = require('fs');
let c = fs.readFileSync('c:/chamados/org/laghetto-org-chart/src/App.jsx', 'utf-8');

c = c.replace(/c\.style\.boxShadow = '0 0 20px #f3e5ab';/g, "c.style.boxShadow = '0 0 40px #ff0000, 0 0 80px #ff0000'; c.style.transform = 'scale(1.3)'; c.style.zIndex = '100'; c.style.border = '4px solid #ff0000';");
c = c.replace(/c\.style\.boxShadow = 'none';/g, "c.style.boxShadow = 'none'; c.style.transform = 'none'; c.style.zIndex = '1'; c.style.border = 'none';");

fs.writeFileSync('c:/chamados/org/laghetto-org-chart/src/App.jsx', c, 'utf-8');
console.log('Fixed search visual');
