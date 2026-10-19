const fs = require('fs');
const vm = require('vm');

const filePath = 'c:/chamados/site/public/index.html';
let html = fs.readFileSync(filePath, 'utf-8');

// 1. Fix line 3224 / 1973: startRecording
html = html.replace(/async\s+function\s*startRecording\(\)/g, 'async function startRecording()');
html = html.replace(/async\s+function\s*\(\)\s*\{\s*if\s*\(!navigator\.mediaDevices/g, 'async function startRecording() {\n    if (!navigator.mediaDevices');

// 2. Fix line 3288: stopRecording
html = html.replace(/function\s*stopRecording/g, 'function stopRecording');

// 3. Fix line 3315: sendChatVoiceMessage
html = html.replace(/async\s+function\s*sendChatVoiceMessage/g, 'async function sendChatVoiceMessage');

// 4. Fix line 3470: showModalAlert
html = html.replace(
  /}showModalAlert\('Chamado # \+ data\.id \+ ' aberto comsucesso!', 'success'\);/g,
  "} showModalAlert('Chamado #' + data.id + ' aberto com sucesso!', 'success');"
);
html = html.replace(
  /}showModalAlert\([^)]*\);/g,
  "} showModalAlert('Chamado #' + data.id + ' aberto com sucesso!', 'success');"
);
html = html.replace(
  /'Chamado # \+ data\.id \+ '/g,
  "'Chamado #' + data.id + '"
);

// General regex fixes for any glued function declarations
html = html.replace(/async\s+function([a-zA-Z0-9_$]+)\s*\(/g, 'async function $1(');
html = html.replace(/function([a-zA-Z0-9_$]+)\s*\(/g, 'function $1(');

fs.writeFileSync(filePath, html, 'utf-8');
console.log('Applied batch syntax fixes');
