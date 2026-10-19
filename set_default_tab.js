const fs = require('fs');

const filePath = 'c:/chamados/site/public/index.html';
let html = fs.readFileSync(filePath, 'utf-8');

// Default tab WhatsApp
html = html.replace("let currentOrigin  = 'site';", "let currentOrigin  = 'bot';");
html = html.replace(
  '<button id="tab-site" data-tab="site" class="tab-btn tab-active">',
  '<button id="tab-site" data-tab="site" class="tab-btn">'
);
html = html.replace(
  '<button id="tab-bot" data-tab="bot" class="tab-btn">',
  '<button id="tab-bot" data-tab="bot" class="tab-btn tab-active">'
);

fs.writeFileSync(filePath, html, 'utf-8');
console.log('Set WhatsApp as default active tab!');
