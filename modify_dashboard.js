const fs = require('fs');
let html = fs.readFileSync('c:/chamados/site/public/index.html', 'utf-8');

// Insert after updateTabCounts();
const logic = `
    const urlParams = new URLSearchParams(window.location.search);
    const openId = urlParams.get('openId');
    if (openId && !window._openedByUrl) {
      window._openedByUrl = true; // prevent infinite loops
      setTimeout(() => {
        const ticket = _allTickets.find(t => String(t.id) === String(openId));
        if (ticket) openDetalhe(ticket);
      }, 500);
    }
`;

html = html.replace(/load\(\);\s*updateTabCounts\(\);/, 'load();\n    updateTabCounts();\n' + logic);
fs.writeFileSync('c:/chamados/site/public/index.html', html, 'utf-8');
console.log('Added openId logic to dashboard');
