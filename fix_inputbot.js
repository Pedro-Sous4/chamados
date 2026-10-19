const fs = require('fs');

const filePath = 'c:/chamados/site/public/index.html';
let html = fs.readFileSync(filePath, 'utf-8');

html = html.replace(
  "// Bot Config Elementsconst inputBot    = document.getElementById('novo-bot-item-input');",
  "// Bot Config Elements\n    const inputBot    = document.getElementById('novo-bot-item-input');"
);

fs.writeFileSync(filePath, html, 'utf-8');
console.log('Fixed inputBot line comment!');
