const fs = require('fs');

const filePath = 'c:/chamados/site/public/index.html';
let html = fs.readFileSync(filePath, 'utf-8');

html = html.replace(
  "document.getElementById('det-titulo').textContent = 'Chamado # + ticket.id;",
  "document.getElementById('det-titulo').textContent = 'Chamado #' + ticket.id;"
);

fs.writeFileSync(filePath, html, 'utf-8');
console.log('Fixed det-titulo quote string!');
