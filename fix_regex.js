const fs = require('fs');
let orgContent = fs.readFileSync('c:/chamados/org/laghetto-org-chart/src/components/OrgChart.jsx', 'utf-8');
orgContent = orgContent.replace(/replace\(\\\\D\/g, ''\)/g, "replace(/\\D/g, '')");
fs.writeFileSync('c:/chamados/org/laghetto-org-chart/src/components/OrgChart.jsx', orgContent, 'utf-8');
console.log('Fixed regex');
