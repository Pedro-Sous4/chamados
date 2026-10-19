const fs = require('fs');

const file = 'c:/chamados/site/public/index.html';
let content = fs.readFileSync(file, 'utf-8');

// Replace the multiline broken string
content = content.replace("subtitleMeta.textContent = 'Carregando...\\n      try {", "subtitleMeta.textContent = 'Carregando...';\n      try {");
content = content.replace("subtitleMeta.textContent = 'Carregando...\n      try {", "subtitleMeta.textContent = 'Carregando...';\n      try {");

fs.writeFileSync(file, content, 'utf-8');
console.log('Fixed syntax error in index.html!');
