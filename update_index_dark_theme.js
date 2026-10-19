const fs = require('fs');

let html = fs.readFileSync('site/public/index.html', 'utf-8');

// Variáveis de tema atualizadas para modo escuro sofisticado e harmonioso
const oldDarkVars = `    html.dark {
      --bg-page: #2c151c;
      --card-bg: rgba(35, 17, 23, 0.96);
      --card-header: #381b24;
      --card-border: rgba(243, 229, 171, 0.25);
      --text-main: #fdfaf5;
      --text-muted: #f3e5ab;
      --toolbar-bg: rgba(35, 17, 23, 0.94);
      --stat-bg: rgba(44, 21, 28, 0.92);
      --table-th-bg: #351922;
      --table-hover: #3d1c27;
      --modal-bg: #2c151c;
      --input-bg: #1f0e14;
      --border-color: rgba(243, 229, 171, 0.22);
    }`;

const newDarkVars = `    html.dark {
      --bg-page: #221016;
      --card-bg: rgba(38, 18, 25, 0.97);
      --card-header: #331520;
      --card-border: rgba(243, 229, 171, 0.22);
      --text-main: #fbf8f2;
      --text-muted: #f3e5ab;
      --toolbar-bg: rgba(32, 14, 21, 0.95);
      --stat-bg: rgba(36, 17, 24, 0.94);
      --table-th-bg: #2c131c;
      --table-hover: #3d1927;
      --modal-bg: #261219;
      --input-bg: #1c0b11;
      --border-color: rgba(243, 229, 171, 0.20);
    }`;

if (!html.includes(oldDarkVars)) {
  console.error('oldDarkVars not found in site/public/index.html');
  process.exit(1);
}
html = html.replace(oldDarkVars, newDarkVars);

// Adicionar estilos dark completos para cabeçalho, tabela, linhas e badges
const oldDarkOverrides = `    /* Dark mode overrides */
    html.dark .bg-white\\/80,
    html.dark .bg-white\\/90,
    html.dark .bg-white {
      background-color: var(--card-bg) !important;
    }

    html.dark .divide-brand-100 > :not([hidden]) ~ :not([hidden]) {
      border-color: var(--border-color) !important;
    }

    html.dark .border-brand-100,
    html.dark .border-brand-100\\/60,
    html.dark .border-brand-200 {
      border-color: var(--border-color) !important;
    }

    html.dark .text-brand-900 {
      color: #f4f4f5 !important;
    }

    html.dark .text-brand-700 {
      color: #e4e4e7 !important;
    }

    html.dark .text-brand-500,
    html.dark .text-brand-400 {
      color: #d4af37 !important;
    }

    html.dark .text-brand-300 {
      color: #a1a1aa !important;
    }

    html.dark .bg-brand-50,
    html.dark .bg-brand-100 {
      background-color: var(--input-bg) !important;
    }

    html.dark .trow:hover {
      background-color: var(--table-hover) !important;
    }

    html.dark #table thead tr {
      background-color: var(--table-th-bg) !important;
    }

    html.dark #modal-detalhe > div,
    html.dark #modal-perfil-solicitante > div,
    html.dark #modal-chamado > div {
      background-color: var(--modal-bg) !important;
      color: #f4f4f5 !important;
      border: 1px solid var(--border-color);
    }

    html.dark .chat-msg-user {
      background: #3d1c27 !important;
      color: #fdfaf5 !important;
      border-color: rgba(243, 229, 171, 0.3) !important;
    }

    html.dark #chat-text-input {
      color: #f4f4f5 !important;
    }

    html.dark .tab-btn {
      color: #a1a1aa;
    }

    html.dark .tab-btn.tab-active {
      color: #d4af37 !important;
      border-bottom-color: #d4af37 !important;
    }

    html.dark #pagination-controls {
      background-color: var(--card-bg) !important;
      border-color: var(--border-color) !important;
    }`;

const newDarkOverrides = `    /* Dark mode overrides */
    html.dark body {
      color: #fbf8f2 !important;
    }

    html.dark header[style*="background"] {
      background: #30141e !important;
      border-bottom: 1px solid rgba(243, 229, 171, 0.2) !important;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
    }

    html.dark .bg-white\\/80,
    html.dark .bg-white\\/90,
    html.dark .bg-white {
      background-color: var(--card-bg) !important;
    }

    html.dark div[style*="background:#fdfaf5"] {
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
      border-bottom-color: rgba(243, 229, 171, 0.12) !important;
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
      color: #fbf8f2 !important;
    }

    html.dark .text-brand-700 {
      color: #f3e5ab !important;
    }

    html.dark .text-brand-500,
    html.dark .text-brand-400 {
      color: #e4c880 !important;
    }

    html.dark .text-brand-300 {
      color: #c9af92 !important;
    }

    html.dark .bg-brand-50,
    html.dark .bg-brand-100 {
      background-color: var(--input-bg) !important;
      color: #fbf8f2 !important;
    }

    html.dark #q,
    html.dark #filter-status {
      background-color: var(--input-bg) !important;
      color: #fbf8f2 !important;
      border-color: var(--border-color) !important;
    }

    html.dark .badge-tipo {
      background: rgba(243, 229, 171, 0.12) !important;
      color: #f3e5ab !important;
      border-color: rgba(243, 229, 171, 0.25) !important;
    }

    html.dark .badge-em_atendimento {
      background: rgba(245, 158, 11, 0.18) !important;
      color: #fbbf24 !important;
      border-color: rgba(245, 158, 11, 0.4) !important;
    }

    html.dark .badge-concluido {
      background: rgba(34, 197, 94, 0.16) !important;
      color: #4ade80 !important;
      border-color: rgba(34, 197, 94, 0.35) !important;
    }

    html.dark .badge-aberto {
      background: rgba(239, 68, 68, 0.18) !important;
      color: #f87171 !important;
      border-color: rgba(239, 68, 68, 0.4) !important;
    }

    html.dark #modal-detalhe > div,
    html.dark #modal-perfil-solicitante > div,
    html.dark #modal-chamado > div {
      background-color: var(--modal-bg) !important;
      color: #fbf8f2 !important;
      border: 1px solid var(--border-color);
    }

    html.dark .chat-msg-user {
      background: #361722 !important;
      color: #fbf8f2 !important;
      border-color: rgba(243, 229, 171, 0.25) !important;
    }

    html.dark #chat-text-input {
      color: #fbf8f2 !important;
    }

    html.dark .tab-btn {
      color: #c9af92;
    }

    html.dark .tab-btn.tab-active {
      color: #f3e5ab !important;
      border-bottom-color: #f3e5ab !important;
    }

    html.dark #pagination-controls {
      background-color: var(--card-bg) !important;
      border-color: var(--border-color) !important;
    }`;

if (!html.includes(oldDarkOverrides)) {
  console.error('oldDarkOverrides not found in site/public/index.html');
  process.exit(1);
}

html = html.replace(oldDarkOverrides, newDarkOverrides);
fs.writeFileSync('site/public/index.html', html, 'utf-8');
console.log('site/public/index.html dark theme updated successfully!');
