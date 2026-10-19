const fs = require('fs');
const path = require('path');

function fixMojibake(text) {
  return text
    .replace(/\u00c3\u00a3/g, 'ã')
    .replace(/\u00c3\u00a1/g, 'á')
    .replace(/\u00c3\u00a0/g, 'à')
    .replace(/\u00c3\u00a2/g, 'â')
    .replace(/\u00c3\u00a9/g, 'é')
    .replace(/\u00c3\u00aa/g, 'ê')
    .replace(/\u00c3\u00ad/g, 'í')
    .replace(/\u00c3\u00b3/g, 'ó')
    .replace(/\u00c3\u00b4/g, 'ô')
    .replace(/\u00c3\u00b5/g, 'õ')
    .replace(/\u00c3\u00ba/g, 'ú')
    .replace(/\u00c3\u00bc/g, 'ü')
    .replace(/\u00c3\u00a7/g, 'ç')
    .replace(/\u00c3\u0083/g, 'Ã')
    .replace(/\u00c3\u0081/g, 'Á')
    .replace(/\u00c3\u0080/g, 'À')
    .replace(/\u00c3\u0082/g, 'Â')
    .replace(/\u00c3\u0089/g, 'É')
    .replace(/\u00c3\u008a/g, 'Ê')
    .replace(/\u00c3\u008d/g, 'Í')
    .replace(/\u00c3\u0093/g, 'Ó')
    .replace(/\u00c3\u0094/g, 'Ô')
    .replace(/\u00c3\u0095/g, 'Õ')
    .replace(/\u00c3\u009a/g, 'Ú')
    .replace(/\u00c3\u0087/g, 'Ç')
    .replace(/\u00e2\u0080\u0094/g, '—')
    .replace(/\u00e2\u0080\u0093/g, '–')
    .replace(/\u00e2\u0080\u00a6/g, '…')
    .replace(/\u00e2\u0086\u0092/g, '→')
    .replace(/\u00f0\u009f\u0091\u00a4/g, '👤')
    .replace(/\u00f0\u009f\u0092\u00bc/g, '💼')
    .replace(/\u00f0\u009f\u009b\u00a1\u00ef\u00b8\u008f/g, '🛡️')
    .replace(/\u00f0\u009f\u009b\u00a1/g, '🛡');
}

const files = [
  'c:/chamados/site/server.js',
  'c:/chamados/site/public/index.html',
  'c:/chamados/site/public/dashboard.html',
  'c:/chamados/site/public/novo-chamado.html',
  'c:/chamados/site/public/login.html',
  'c:/chamados/site/public/gerenciar-logins.html'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    const raw = fs.readFileSync(f, 'utf8');
    const fixed = fixMojibake(raw);
    if (raw !== fixed) {
      fs.writeFileSync(f, fixed, 'utf8');
      console.log('Fixed mojibake in:', f);
    } else {
      console.log('Clean:', f);
    }
  }
});
