const fs = require('fs');

let html = fs.readFileSync('site/public/index.html', 'utf8');

const p1 = html.indexOf('html.dark {');
const p2 = html.indexOf('/* ---------- Badge ---------- */', p1);

if (p1 === -1 || p2 === -1) {
  console.error('Target not found in site/public/index.html');
  process.exit(1);
}

const newDarkSection = `html.dark {
      --bg-page: #420603;
      --card-bg: rgba(66, 7, 4, 0.96);
      --card-header: #590906;
      --card-border: rgba(223, 150, 126, 0.28);
      --text-main: #fff5f0;
      --text-muted: #df967e;
      --toolbar-bg: rgba(74, 9, 5, 0.96);
      --stat-bg: rgba(85, 10, 6, 0.94);
      --table-th-bg: #520905;
      --table-hover: #6e1713;
      --modal-bg: #4a0905;
      --input-bg: #350402;
      --border-color: rgba(223, 150, 126, 0.25);
    }

    body {
      background: var(--bg-page) !important;
      color: var(--text-main);
      transition: background-color 0.25s ease, color 0.25s ease;
    }

    /* Dark mode overrides */
    html.dark body {
      color: #fff5f0 !important;
    }

    html.dark header[style*="background"] {
      background: #7d0904 !important;
      border-bottom: 1px solid rgba(223, 150, 126, 0.35) !important;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.45) !important;
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
      border-bottom-color: rgba(223, 150, 126, 0.16) !important;
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
      color: #fff5f0 !important;
    }

    html.dark .text-brand-700 {
      color: #ffc5a7 !important;
    }

    html.dark .text-brand-500,
    html.dark .text-brand-400 {
      color: #df967e !important;
    }

    html.dark .text-brand-300 {
      color: #be6755 !important;
    }

    html.dark .bg-brand-50,
    html.dark .bg-brand-100 {
      background-color: var(--input-bg) !important;
      color: #fff5f0 !important;
    }

    html.dark #q,
    html.dark #filter-status,
    html.dark #filter-origem {
      background-color: var(--input-bg) !important;
      color: #fff5f0 !important;
      border-color: var(--border-color) !important;
    }

    html.dark #btn-refresh {
      background: #9e382d !important;
      box-shadow: 0 2px 14px rgba(125, 9, 4, 0.45) !important;
    }

    html.dark .badge-tipo {
      background: rgba(223, 150, 126, 0.16) !important;
      color: #ffc5a7 !important;
      border-color: rgba(223, 150, 126, 0.35) !important;
    }

    html.dark .badge-em_atendimento {
      background: rgba(245, 158, 11, 0.20) !important;
      color: #fde68a !important;
      border-color: rgba(245, 158, 11, 0.45) !important;
    }

    html.dark .badge-concluido {
      background: rgba(34, 197, 94, 0.18) !important;
      color: #86efac !important;
      border-color: rgba(34, 197, 94, 0.40) !important;
    }

    html.dark .badge-aberto {
      background: rgba(239, 68, 68, 0.20) !important;
      color: #fca5a5 !important;
      border-color: rgba(239, 68, 68, 0.45) !important;
    }

    html.dark #modal-detalhe > div,
    html.dark #modal-perfil-solicitante > div,
    html.dark #modal-perfil > div,
    html.dark #modal-chamado > div,
    html.dark #modal-config > div {
      background-color: var(--modal-bg) !important;
      color: #fff5f0 !important;
      border: 1px solid var(--border-color);
    }

    html.dark div[style*="background:#925616"] {
      background: #7d0904 !important;
    }

    html.dark .chat-msg-user {
      background: #590906 !important;
      color: #fff5f0 !important;
      border-color: rgba(223, 150, 126, 0.30) !important;
    }

    html.dark .chat-msg-tech {
      background: #9e382d !important;
      color: #ffffff !important;
      box-shadow: 0 2px 10px rgba(125, 9, 4, 0.35) !important;
    }

    html.dark #chat-text-input {
      color: #fff5f0 !important;
      background: transparent !important;
    }

    html.dark #chat-bubble-container {
      background: #350402 !important;
      border-color: var(--border-color) !important;
    }

    html.dark #chat-input-bar {
      background: #4a0905 !important;
      border-color: var(--border-color) !important;
    }

    html.dark .tab-btn {
      color: #be6755;
    }

    html.dark .tab-btn.tab-active {
      color: #ffc5a7 !important;
      border-bottom-color: #ffc5a7 !important;
    }

    html.dark #pagination-controls {
      background-color: var(--card-bg) !important;
      border-color: var(--border-color) !important;
    }

    html.dark #pagination-controls button {
      background-color: #590906 !important;
      color: #ffc5a7 !important;
      border-color: rgba(223, 150, 126, 0.30) !important;
    }
`;

html = html.substring(0, p1) + newDarkSection + '\n    ' + html.substring(p2);
fs.writeFileSync('site/public/index.html', html, 'utf8');
console.log('site/public/index.html dark theme updated successfully!');
