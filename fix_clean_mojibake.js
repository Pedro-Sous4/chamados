const fs = require('fs');

const filePath = 'c:/chamados/site/public/index.html';
let html = fs.readFileSync(filePath, 'utf-8');

// 1. Fix det-sala overwrite bug: show colabSetor if sala is not informed
html = html.replace(
  "document.getElementById('det-sala').textContent = ticket.sala || 'Não informado';",
  "document.getElementById('det-sala').textContent = ticket.colabSetor || ticket.sala || 'Não informado';"
);

// 2. Fix emojis array with true clean emojis
const cleanEmojis = "const CHAT_EMOJIS = ['😊', '😂', '🥰', '😍', '👍', '🙏', '❤️', '🎉', '🤔', '😢', '🔥', '👏', '👌', '🚀', '👀', '✨'];";
html = html.replace(/const CHAT_EMOJIS = \[.*?\];/, cleanEmojis);

// 3. Fix Solução Anexada and clean text
html = html.replace(/SoluÃ§Ã£o Anexada/g, 'Solução Anexada');
html = html.replace(/Ver arquivo desoluÃ§Ã£o/g, 'Ver arquivo de solução');
html = html.replace(/desoluÃ§Ã£o/g, 'de solução');
html = html.replace(/soluÃ§Ã£o/g, 'solução');
html = html.replace(/ConfiguraÃ§Ãµes/g, 'Configurações');

// 4. Fix space in Atualizado às <time>
html = html.replace("metaEl.textContent = 'Atualizado às' + now;", "metaEl.textContent = 'Atualizado às ' + now;");

fs.writeFileSync(filePath, html, 'utf-8');
console.log('Fixed all emoji mojibakes, det-sala precedence and texts successfully!');
