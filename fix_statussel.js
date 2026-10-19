const fs = require('fs');

const filePath = 'c:/chamados/site/public/index.html';
let html = fs.readFileSync(filePath, 'utf-8');

html = html.replace('conststatusSel   = document.getElementById(\'filter-status\');', 'const statusSel   = document.getElementById(\'filter-status\');');

// Also check for any other const<name> glued together
html = html.replace(/const([a-zA-Z0-9_$]+)\s*=\s*document\.getElementById/g, 'const $1 = document.getElementById');

fs.writeFileSync(filePath, html, 'utf-8');
console.log('Fixed const statusSel spacing!');
