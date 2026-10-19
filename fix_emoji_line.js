const fs = require('fs');

const filePath = 'c:/chamados/site/public/index.html';
let html = fs.readFileSync(filePath, 'utf-8');

html = html.replace(
  "// Abre/fecha painel de emojisdocument.getElementById('btn-chat-emoji').addEventListener('click', (e) => {",
  "// Abre/fecha painel de emojis\n  document.getElementById('btn-chat-emoji').addEventListener('click', (e) => {"
);

fs.writeFileSync(filePath, html, 'utf-8');
console.log('Fixed emoji button listener line!');
