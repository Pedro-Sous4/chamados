const fs = require('fs');

const filePath = 'c:/chamados/site/public/index.html';
let html = fs.readFileSync(filePath, 'utf-8');

// Fix all const<word> where const got glued to an identifier starting with 's' or anything else
html = html.replace(/\bconst([a-zA-Z_$][a-zA-Z0-9_$]*)/g, (match, p1) => {
  return 'const ' + p1;
});

// Fix all let<word> where let got glued
html = html.replace(/\blet([a-zA-Z_$][a-zA-Z0-9_$]*)/g, (match, p1) => {
  return 'let ' + p1;
});

// Fix return<word> where return got glued
html = html.replace(/\breturn([a-zA-Z_$][a-zA-Z0-9_$]*)/g, (match, p1) => {
  return 'return ' + p1;
});

// Fix if<word> or elseif
html = html.replace(/\bif\(/g, 'if (');

// Fix specific variables mentioned by subagent
html = html.replace(/returnsol ===solLabel/g, 'return sol === solLabel');
html = html.replace(/returnsol/g, 'return sol');
html = html.replace(/===solLabel/g, '=== solLabel');

fs.writeFileSync(filePath, html, 'utf-8');
console.log('Fixed all glued variable declarations and returns!');
