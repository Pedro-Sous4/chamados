const fs = require('fs');

const filePath = 'c:/chamados/site/public/index.html';
let html = fs.readFileSync(filePath, 'utf-8');

html = html.replace(
  "// InicializaÃ§Ã£o do Painel de Emojisconst CHAT_EMOJIS",
  "// Inicialização do Painel de Emojis\n  const CHAT_EMOJIS"
);

// Also check for any other comments that have const directly attached
html = html.replace(/\/\/[^\n]*?const\s+/g, (match) => {
  const parts = match.split('const');
  return parts[0] + '\n  const' + parts.slice(1).join('const');
});

// Same for let
html = html.replace(/\/\/[^\n]*?let\s+/g, (match) => {
  const parts = match.split('let');
  return parts[0] + '\n  let' + parts.slice(1).join('let');
});

fs.writeFileSync(filePath, html, 'utf-8');
console.log('Fixed CHAT_EMOJIS comment line!');
