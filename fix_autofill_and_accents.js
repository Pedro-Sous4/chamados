const fs = require('fs');

const filePath = 'c:/chamados/site/public/index.html';
let html = fs.readFileSync(filePath, 'utf-8');

// 1. Fix line 2426 comment breaking setInterval
html = html.replace(
  /\/\/ Atualiza[^\n]*30segundossetInterval/,
  '// Atualização automática da lista principal a cada 30 segundos\n  setInterval'
);

// 2. Prevent browser from auto-filling saved login email (ti2@laghettomultipropriedade.com.br) into the search bar
html = html.replace(
  /<input type="search"[^>]*id="q"[^>]*>/i,
  '<input type="text" id="q" name="busca_filtro_chamados" autocomplete="off" readonly onfocus="this.removeAttribute(\'readonly\');" placeholder="Buscar nome, número, descrição..." class="w-full pl-10 pr-3 py-2.5 rounded-xl border border-brand-100 bg-brand-50 text-sm text-brand-900 outline-none focus:bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-400/15 placeholder-brand-300/80 transition-all" />'
);

// Also add a listener on load and tab click to clear autofilled email
if (!html.includes('prevent_autofill_email_in_search')) {
  const guard = `
  // prevent_autofill_email_in_search
  function sanitizeSearchInput() {
    if (qInput && qInput.value && qInput.value.includes('@')) {
      qInput.value = '';
    }
  }
  window.addEventListener('load', sanitizeSearchInput);
  setTimeout(sanitizeSearchInput, 500);
  setTimeout(sanitizeSearchInput, 1500);
  `;
  html = html.replace('let debTimer;', guard + '\n  let debTimer;');
}

// 3. Fix corrupted accents in badges and pagination
html = html.split('ConcluÃo').join('Concluído');
html = html.split('ConcluÃdo').join('Concluído');
html = html.split('ConcluÃ­do').join('Concluído');
html = html.split('ConcluÃ­dos').join('Concluídos');
html = html.split('Concludo').join('Concluído');
html = html.split('Concludos').join('Concluídos');
html = html.replace(/Pr[^<]*ximo/g, 'Próximo');
html = html.split('Atualizado Ãs').join('Atualizado às ');
html = html.split('Atualizado Â às').join('Atualizado às ');
html = html.split('Atualizado Ã às').join('Atualizado às ');

// Replace the status configs explicitly
html = html.replace(/concluido:\s*\{\s*label:'[^']*',\s*cls:'badge-concluido'\s*\}/g, "concluido: { label:'Concluído', cls:'badge-concluido' }");

fs.writeFileSync(filePath, html, 'utf-8');
console.log('Successfully sanitized index.html!');
