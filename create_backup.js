const fs = require('fs');
const path = require('path');

const backupDir = 'c:/chamados/backups';
if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const filesToBackup = [
  'c:/chamados/site/public/index.html',
  'c:/chamados/site/server.js',
  'c:/chamados/org/laghetto-org-chart/src/App.jsx',
  'c:/chamados/org/laghetto-org-chart/src/components/OrgChart.jsx',
  'c:/chamados/org/laghetto-org-chart/src/components/Card.jsx',
  'c:/chamados/org/laghetto-org-chart/src/components/Modal.jsx'
];

filesToBackup.forEach(f => {
  if (fs.existsSync(f)) {
    const base = path.basename(f);
    const dest = path.join(backupDir, base + '_' + timestamp + '.bak');
    fs.copyFileSync(f, dest);
    console.log('Saved backup:', dest);
  }
});
