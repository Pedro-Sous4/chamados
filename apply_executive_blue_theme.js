const fs = require('fs');

let html = fs.readFileSync('site/public/index.html', 'utf8');

// 1. Atualizar o tailwind.config com a paleta corporativa azul profissional
const oldTailwind = `    tailwind.config = {
      theme: {
        extend: {
          colors: {
            brand: {
              50:  '#FDF8F0',
              100: '#F5ECCB',
              200: '#FDF0E0',
              300: '#c9a882',
              400: '#B6741A',
              500: '#925616',
              900: '#3b2008',
            }
          }
        }
      }
    }`;

const newTailwind = `    tailwind.config = {
      theme: {
        extend: {
          colors: {
            brand: {
              50:  '#f8fafc',
              100: '#e2e8f0',
              200: '#cbd5e1',
              300: '#94a3b8',
              400: '#3b82f6',
              500: '#2563eb',
              600: '#1d4ed8',
              700: '#1e3a8a',
              800: '#1e293b',
              900: '#0f172a',
            }
          }
        }
      }
    }`;

if (html.includes(oldTailwind)) {
  html = html.replace(oldTailwind, newTailwind);
} else {
  console.log('Aviso: oldTailwind não encontrado exatamente, buscando por cores...');
  html = html.replace(/colors:\s*\{\s*brand:\s*\{[\s\S]*?\}\s*\}/, `colors: {
            brand: {
              50:  '#f8fafc',
              100: '#e2e8f0',
              200: '#cbd5e1',
              300: '#94a3b8',
              400: '#3b82f6',
              500: '#2563eb',
              600: '#1d4ed8',
              700: '#1e3a8a',
              800: '#1e293b',
              900: '#0f172a',
            }
          }`);
}

// 2. Atualizar variáveis :root (Claro) e html.dark (Escuro)
const pRoot = html.indexOf(':root {');
const pBadge = html.indexOf('/* ---------- Badge ---------- */');

if (pRoot === -1 || pBadge === -1) {
  console.error('Target root/badge não encontrado em index.html');
  process.exit(1);
}

const newThemesCSS = `:root {
      /* Modo Claro: Executive Blue & Clean White */
      --bg-page: #f8fafc;
      --card-bg: #ffffff;
      --card-header: #f1f5f9;
      --card-border: #e2e8f0;
      --text-main: #0f172a;
      --text-muted: #64748b;
      --toolbar-bg: rgba(255, 255, 255, 0.95);
      --stat-bg: #ffffff;
      --table-th-bg: #f8fafc;
      --table-hover: #eff6ff;
      --modal-bg: #ffffff;
      --input-bg: #f8fafc;
      --border-color: #e2e8f0;
      --header-bg: #1e3a8a;
      --primary: #1e3a8a;
      --primary-accent: #3b82f6;
    }

    html.dark {
      /* Modo Escuro: Deep Slate Navy & Ice Blue Highlights */
      --bg-page: #0b1120;
      --card-bg: #111c33;
      --card-header: #15223e;
      --card-border: rgba(59, 130, 246, 0.22);
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --toolbar-bg: rgba(17, 28, 51, 0.95);
      --stat-bg: #111c33;
      --table-th-bg: #15223e;
      --table-hover: #1e2e4f;
      --modal-bg: #111c33;
      --input-bg: #0b1120;
      --border-color: rgba(59, 130, 246, 0.20);
      --header-bg: #0f172a;
      --primary: #3b82f6;
      --primary-accent: #60a5fa;
    }

    body {
      background: var(--bg-page) !important;
      color: var(--text-main);
      transition: background-color 0.25s ease, color 0.25s ease;
    }

    header[style*="background"] {
      background: #1e3a8a !important;
      border-bottom: 1px solid rgba(255, 255, 255, 0.12) !important;
      box-shadow: 0 4px 20px rgba(15, 23, 42, 0.15) !important;
    }

    /* Dark mode overrides */
    html.dark body {
      color: #f8fafc !important;
    }

    html.dark header[style*="background"] {
      background: #0f172a !important;
      border-bottom: 1px solid rgba(59, 130, 246, 0.25) !important;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5) !important;
    }

    html.dark .bg-white\\/80,
    html.dark .bg-white\\/90,
    html.dark .bg-white {
      background-color: var(--card-bg) !important;
    }

    html.dark div[style*="background:#fdfaf5"],
    html.dark div[style*="background: #fdfaf5"] {
      background: var(--card-header) !important;
      border-color: var(--card-border) !important;
    }

    html.dark div[style*="background:rgba(255,255,255"] {
      background: var(--card-bg) !important;
    }

    html.dark #table {
      background-color: var(--card-bg) !important;
    }

    html.dark #table tbody tr.trow {
      background-color: var(--card-bg) !important;
      border-bottom-color: rgba(59, 130, 246, 0.14) !important;
    }

    html.dark .trow:hover,
    html.dark .trow[data-status="aberto"]:hover,
    html.dark .trow[data-status="em_atendimento"]:hover,
    html.dark .trow[data-status="concluido"]:hover,
    html.dark .trow[data-status="cancelado"]:hover {
      background-color: var(--table-hover) !important;
    }

    html.dark #table thead tr {
      background-color: var(--table-th-bg) !important;
      border-bottom-color: var(--border-color) !important;
    }

    html.dark .divide-brand-100 > :not([hidden]) ~ :not([hidden]) {
      border-color: var(--border-color) !important;
    }

    html.dark .border-brand-100,
    html.dark .border-brand-100\\/60,
    html.dark .border-brand-200 {
      border-color: var(--border-color) !important;
    }

    html.dark .text-brand-900,
    html.dark .sol-name {
      color: #f8fafc !important;
    }

    html.dark .text-brand-700 {
      color: #cbd5e1 !important;
    }

    html.dark .text-brand-500,
    html.dark .text-brand-400 {
      color: #60a5fa !important;
    }

    html.dark .text-brand-300 {
      color: #94a3b8 !important;
    }

    html.dark .bg-brand-50,
    html.dark .bg-brand-100 {
      background-color: var(--input-bg) !important;
      color: #f8fafc !important;
    }

    html.dark #q,
    html.dark #filter-status,
    html.dark #filter-origem {
      background-color: var(--input-bg) !important;
      color: #f8fafc !important;
      border-color: var(--border-color) !important;
    }

    html.dark #btn-refresh {
      background: #2563eb !important;
      box-shadow: 0 2px 14px rgba(37, 99, 235, 0.35) !important;
    }

    html.dark .badge-tipo {
      background: rgba(59, 130, 246, 0.15) !important;
      color: #93c5fd !important;
      border-color: rgba(59, 130, 246, 0.35) !important;
    }

    html.dark .badge-em_atendimento {
      background: rgba(37, 99, 235, 0.20) !important;
      color: #93c5fd !important;
      border-color: rgba(37, 99, 235, 0.45) !important;
    }

    html.dark .badge-concluido {
      background: rgba(22, 163, 74, 0.20) !important;
      color: #86efac !important;
      border-color: rgba(22, 163, 74, 0.45) !important;
    }

    html.dark .badge-aberto {
      background: rgba(217, 119, 6, 0.20) !important;
      color: #fde68a !important;
      border-color: rgba(217, 119, 6, 0.45) !important;
    }

    html.dark #modal-detalhe > div,
    html.dark #modal-perfil-solicitante > div,
    html.dark #modal-perfil > div,
    html.dark #modal-chamado > div,
    html.dark #modal-config > div,
    html.dark #modal-config-overlay > div {
      background-color: var(--modal-bg) !important;
      color: #f8fafc !important;
      border: 1px solid var(--border-color);
    }

    html.dark div[style*="background:#925616"],
    html.dark div[style*="background: #925616"] {
      background: #1e3a8a !important;
    }

    html.dark .chat-msg-user {
      background: #1e293b !important;
      color: #f8fafc !important;
      border-color: rgba(59, 130, 246, 0.30) !important;
    }

    html.dark .chat-msg-tech {
      background: #2563eb !important;
      color: #ffffff !important;
      box-shadow: 0 2px 10px rgba(37, 99, 235, 0.35) !important;
    }

    html.dark #chat-text-input {
      color: #f8fafc !important;
      background: transparent !important;
    }

    html.dark #chat-bubble-container {
      background: #0b1120 !important;
      border-color: var(--border-color) !important;
    }

    html.dark #chat-input-bar {
      background: #15223e !important;
      border-color: var(--border-color) !important;
    }

    html.dark .tab-btn {
      color: #94a3b8;
    }

    html.dark .tab-btn.tab-active {
      color: #60a5fa !important;
      border-bottom-color: #60a5fa !important;
    }

    html.dark #pagination-controls {
      background-color: var(--card-bg) !important;
      border-color: var(--border-color) !important;
    }

    html.dark #pagination-controls button {
      background-color: #15223e !important;
      color: #93c5fd !important;
      border-color: rgba(59, 130, 246, 0.30) !important;
    }
`;

html = html.substring(0, pRoot) + newThemesCSS + '\n    ' + html.substring(pBadge);

// 3. Substituir referências duras de tons marrons / dourados legados por tons azuis corporativos
html = html.replace(/style="background:#c98830"/g, 'style="background:#1e3a8a"');
html = html.replace(/style="background:#f0c060;border:1px solid rgba\(255,255,255,0.2\)"/g, 'style="background:#3b82f6;color:#ffffff;border:1px solid rgba(255,255,255,0.2)"');
html = html.replace(/style="background:#925616"/g, 'style="background:#1e3a8a"');
html = html.replace(/style="background: #925616"/g, 'style="background:#1e3a8a"');
html = html.replace(/linear-gradient\(135deg,#c98830 0%,#925616 100%\)/g, 'linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%)');
html = html.replace(/border-bottom:1.5px solid #F5ECCB/g, 'border-bottom:1.5px solid #e2e8f0');
html = html.replace(/style="background:#faf6ee;border-bottom:1.5px solid #F5ECCB"/g, 'style="background:#f8fafc;border-bottom:1.5px solid #e2e8f0"');
html = html.replace(/style="background:#fdf8f0;border:1px solid #F5ECCB"/g, 'style="background:#eff6ff;border:1px solid #bfdbfe"');
html = html.replace(/style="background:#fdfaf5;border-bottom:1.5px solid #F5ECCB"/g, 'style="background:#f1f5f9;border-bottom:1.5px solid #e2e8f0"');

// Atualizar cores dos botões de abas no modal de config
html = html.replace(/style="color:#925616; border-bottom-color:#925616"/g, 'style="color:#1e3a8a; border-bottom-color:#1e3a8a"');
html = html.replace(/style="color:#925616"/g, 'style="color:#1e3a8a"');
html = html.replace(/style="background:#f5eccb"/g, 'style="background:#eff6ff"');

fs.writeFileSync('site/public/index.html', html, 'utf8');
console.log('site/public/index.html updated with Executive Blue & Deep Navy themes!');
