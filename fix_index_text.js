const fs = require('fs');
let html = fs.readFileSync('c:/chamados/site/public/index.html', 'utf-8');

html = html.replace(/Buscando chamados[^\w<]*/g, 'Buscando chamados...');
html = html.replace(/Carregando[^\w<]*/g, 'Carregando...');
html = html.replace(/Rob Desativado/g, 'Robô Desativado');
html = html.replace(/VocǦ estǭ/g, 'Você está');
html = html.replace(/Erro de conexǜo/g, 'Erro de conexão');
html = html.replace(/Nenhum login cadastrado[^\w<]*/g, 'Nenhum login cadastrado.');
html = html.replace(/Nenhum contato cadastrado[^\w<]*/g, 'Nenhum contato cadastrado.');
html = html.replace(/Chamados \?" Laghetto/g, 'Chamados Laghetto');

fs.writeFileSync('c:/chamados/site/public/index.html', html, 'utf-8');
console.log('Fixed index.html text');
