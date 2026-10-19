const fs = require('fs');
let c = fs.readFileSync('c:/chamados/site/server.js', 'utf-8');
c = c.replace(
  /const mimes = \{ '\.html': 'text\/html', '\.css': 'text\/css', '\.js': 'application\/javascript', '\.png': 'image\/png' \};/,
  "const mimes = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.png': 'image/png' };"
);
fs.writeFileSync('c:/chamados/site/server.js', c, 'utf-8');
