const fs = require('fs');
let c = fs.readFileSync('c:/chamados/site/server.js', 'utf-8');

c = c.replace(
  /let body = '';\s*req\.on\('data', chunk => \(body \+= chunk\)\);/,
  "const chunks = [];\n    req.on('data', chunk => chunks.push(chunk));"
);

c = c.replace(
  /let data;\s*try \{ data = JSON\.parse\(body\);/,
  "let body = Buffer.concat(chunks).toString('utf-8');\n      let data;\n      try { data = JSON.parse(body);"
);

fs.writeFileSync('c:/chamados/site/server.js', c, 'utf-8');
console.log("Fixed server.js");
