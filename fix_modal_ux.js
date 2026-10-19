const fs = require('fs');

const filePath = 'c:/chamados/site/public/index.html';
let html = fs.readFileSync(filePath, 'utf-8');

// 1. Fix photo inside modal: make sure det-avatar has proper width and height when showing photo or avatar
html = html.replace('class="avatarshrink-0"', 'class="w-11 h-11 rounded-full flex items-center justify-center shrink-0 overflow-hidden font-bold text-white text-sm shadow-sm"');
html = html.replace(
  'document.getElementById(\'det-avatar\').innerHTML = `<img src="${ticket.foto}" class="w-full h-full object-cover rounded-full" />`;',
  'const avEl = document.getElementById(\'det-avatar\'); avEl.style.background = \'transparent\'; avEl.innerHTML = `<img src="${ticket.foto}" class="w-full h-full object-cover rounded-full" />`;'
);

// 2. Fix text accents in modal details:
html = html.replace(/NÃ£o informado/g, 'Não informado');
html = html.replace(/AnexosdisponÃ­veis/g, 'Anexos disponíveis');
html = html.replace(/Anexo disponÃ­vel/g, 'Anexo disponível');
html = html.replace(/Seu navegador nÃ£osuporta Ã¡udio\./g, 'Seu navegador não suporta áudio.');
html = html.replace(/TÃ©cnico/g, 'Técnico');
html = html.replace(/' Ãs'/g, "' às '");
html = html.replace(/d\.toLocaleDateString\('pt-BR'\) \+ ' Ãs' \+/g, "d.toLocaleDateString('pt-BR') + ' às ' +");

// 3. Fix glued CSS and classes inside chat
html = html.replace(/controlsclass=/g, 'controls class=');
html = html.replace(/text-xsfont-bold/g, 'text-xs font-bold');
html = html.replace(/text-xsfont-mono/g, 'text-xs font-mono');
html = html.replace(/transition-allshadow-md/g, 'transition-all shadow-md');
html = html.replace(/transition-colorsbg-transparent/g, 'transition-colors bg-transparent');
html = html.replace(/transition-all p-1 bg-transparent border-none cursor-pointershrink-0/g, 'transition-all p-1 bg-transparent border-none cursor-pointer shrink-0');
html = html.replace(/rounded-2xlshadow-xl/g, 'rounded-2xl shadow-xl');
html = html.replace(/shrink-0shadow-/g, 'shrink-0 shadow-');
html = html.replace(/mb-2shadow-sm/g, 'mb-2 shadow-sm');
html = html.replace(/fade-inslide-in-from-bottom-2/g, 'fade-in slide-in-from-bottom-2');
html = html.replace(/animate-pulseshrink-0/g, 'animate-pulse shrink-0');
html = html.replace(/text-xstext-orange-800/g, 'text-xs text-orange-800');
html = html.replace(/text-orange-500shrink-0/g, 'text-orange-500 shrink-0');
html = html.replace(/px-4 py-3shrink-0/g, 'px-4 py-3 shrink-0');
html = html.replace(/px-6 py-4shrink-0/g, 'px-6 py-4 shrink-0');

fs.writeFileSync(filePath, html, 'utf-8');
console.log('Fixed det-avatar and accents in modal successfully!');
