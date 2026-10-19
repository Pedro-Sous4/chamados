const fs = require('fs');

const filePath = 'c:/chamados/site/public/index.html';
let html = fs.readFileSync(filePath, 'utf-8');

html = html.replace(';statusSel.addEventListener', ';\n  statusSel.addEventListener');
html = html.replace('debTimer =setTimeout(load, 300);', 'debTimer = setTimeout(load, 300);');
html = html.replace("qInput.value    = '';statusSel.value = '';", "qInput.value = '';\n    statusSel.value = '';");
html = html.replace('toastOut .22sease forwards', 'toastOut .22s ease forwards');

fs.writeFileSync(filePath, html, 'utf-8');
console.log('Fixed spacing cleanly!');
