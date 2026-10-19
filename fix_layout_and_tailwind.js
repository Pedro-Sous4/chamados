const fs = require('fs');

const filePath = 'c:/chamados/site/public/index.html';
let html = fs.readFileSync(filePath, 'utf-8');

// 1. Fix missing space in script tags (which caused Tailwind and Lucide NOT to load!)
html = html.replace(/<scriptsrc=/g, '<script src=');

// 2. Fix CSS border solid spaces
html = html.replace(/(\d+(?:\.\d+)?px)solid/g, '$1 solid');

// 3. Fix other glued inline styles and classes
html = html.replace(/justify-centershrink-0/g, 'justify-center shrink-0');
html = html.replace(/"style=/g, '" style=');
html = html.replace(/<spanstyle=/g, '<span style=');
html = html.replace(/'stroke=/g, "' stroke=");
html = html.replace(/'stroke-width=/g, "' stroke-width=");
html = html.replace(/'stroke-linecap=/g, "' stroke-linecap=");
html = html.replace(/'stroke-linejoin=/g, "' stroke-linejoin=");

// 4. Fix general Portuguese accented titles and texts
html = html.replace('Chamadosâ€” Laghetto', 'Central de Chamados — Laghetto');
html = html.replace('Chamadosrecentes', 'Chamados recentes');
html = html.replace('Todososstatus', 'Todos os status');
html = html.replace('outrosfiltrosou', 'outros filtros ou');
html = html.replace('E-mail dosolicitante', 'E-mail do solicitante');
html = html.replace('Chamadosabertos', 'Chamados abertos');
html = html.replace(/Salvar V[^\s<]*nculo/g, 'Salvar Vínculo');
html = html.replace(/Chamado #[^\s<"]*/g, 'Chamado #');
html = html.replace(/Informa[^\s<]*es\s*do\s*Usu[^\s<]*rio/g, 'Informações do Usuário');
html = html.replace(/Informa[^\s<]*es/g, 'Informações');
html = html.replace(/Usu[^\s<]*rio/g, 'Usuário');

fs.writeFileSync(filePath, html, 'utf-8');
console.log('Restored scripts, Tailwind, and styling!');
