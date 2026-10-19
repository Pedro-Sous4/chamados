const fs = require('fs');
let html = fs.readFileSync('c:/chamados/site/public/index.html', 'utf-8');

// Replace the fragile openId logic with a robust fetch
const oldLogicRegex = /const urlParams = new URLSearchParams\(window\.location\.search\);[\s\S]*?window\._openedByUrl = true;[\s\S]*?if \(ticket\) openDetalhe\(ticket\);[\s\S]*?\}, 500\);\s*\}/;

const newLogic = `const urlParams = new URLSearchParams(window.location.search);
    const openId = urlParams.get('openId');
    if (openId && !window._openedByUrl) {
      window._openedByUrl = true;
      fetch('/api/tickets/' + openId, {
        headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('auth_token') || '') }
      })
      .then(r => r.ok ? r.json() : null)
      .then(ticket => {
        if (ticket && ticket.id) {
          openDetalhe(ticket);
        }
      })
      .catch(e => console.error('Erro ao abrir chamado direto:', e));
    }`;

html = html.replace(oldLogicRegex, newLogic);
fs.writeFileSync('c:/chamados/site/public/index.html', html, 'utf-8');
console.log('Fixed auto-open logic in index.html');
