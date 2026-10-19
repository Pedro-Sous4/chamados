const fs = require('fs');

const filePath = 'c:/chamados/site/public/index.html';
let html = fs.readFileSync(filePath, 'utf-8');

// 1. Add dark theme CSS variables and styles
const darkStyles = `
    /* ---------- Theme Transition & Variables ---------- */
    :root {
      --bg-page: #f0ebe0;
      --card-bg: rgba(255, 255, 255, 0.95);
      --card-header: #fdfaf5;
      --card-border: #F5ECCB;
      --text-main: #3b2008;
      --text-muted: #925616;
      --toolbar-bg: rgba(255, 255, 255, 0.90);
      --stat-bg: rgba(255, 255, 255, 0.85);
      --table-th-bg: #faf6ee;
      --table-hover: #fdf8f1;
      --modal-bg: #ffffff;
      --input-bg: #FDF8F0;
      --border-color: #F5ECCB;
    }

    html.dark {
      --bg-page: #121214;
      --card-bg: rgba(24, 24, 27, 0.96);
      --card-header: #1f1f23;
      --card-border: #333338;
      --text-main: #f4f4f5;
      --text-muted: #d4af37;
      --toolbar-bg: rgba(24, 24, 27, 0.92);
      --stat-bg: rgba(24, 24, 27, 0.90);
      --table-th-bg: #1c1c20;
      --table-hover: #27272a;
      --modal-bg: #18181b;
      --input-bg: #222226;
      --border-color: #3f3f46;
    }

    body {
      background: var(--bg-page) !important;
      color: var(--text-main);
      transition: background-color 0.25s ease, color 0.25s ease;
    }

    /* Dark mode overrides */
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
      background: #27272a !important;
      color: #f4f4f5 !important;
      border-color: #3f3f46 !important;
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
    }
`;

html = html.replace('/* ---------- Fundo da pÃ¡gina ---------- */\n    body { background:#f0ebe0; }', darkStyles);

// 2. Add Theme Toggle Button to the Header
const themeButtonHtml = `
      <!-- Botão Tema Claro / Escuro -->
      <button id="btn-theme-toggle" type="button" title="Alternar tema Claro / Escuro"
              class="inline-flex items-center justify-center w-10 h-10 rounded-xl text-white/90 hover:text-white hover:bg-white/10 transition-all border border-white/20 bg-white/5 cursor-pointer">
        <i id="theme-icon" data-lucide="moon" class="w-5 h-5"></i>
      </button>
`;

html = html.replace('<button id="btn-logout"', themeButtonHtml + '\n      <button id="btn-logout"');

// 3. Add Theme Toggle JS logic
const themeScript = `
  /* ---------- Gerenciamento de Tema (Claro / Escuro) ---------- */
  function applyTheme(isDark) {
    const root = document.documentElement;
    const icon = document.getElementById('theme-icon');
    if (isDark) {
      root.classList.add('dark');
      if (icon) icon.setAttribute('data-lucide', 'sun');
      localStorage.setItem('laghetto_theme', 'dark');
    } else {
      root.classList.remove('dark');
      if (icon) icon.setAttribute('data-lucide', 'moon');
      localStorage.setItem('laghetto_theme', 'light');
    }
    if (window.lucide) lucide.createIcons();
  }

  const savedTheme = localStorage.getItem('laghetto_theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialDark = savedTheme ? savedTheme === 'dark' : prefersDark;
  applyTheme(initialDark);

  document.getElementById('btn-theme-toggle').addEventListener('click', function() {
    const isDark = document.documentElement.classList.contains('dark');
    applyTheme(!isDark);
  });
`;

html = html.replace("document.getElementById('btn-logout').addEventListener('click',", themeScript + "\n  document.getElementById('btn-logout').addEventListener('click',");

fs.writeFileSync(filePath, html, 'utf-8');
console.log('Added dark/light theme to index.html successfully!');
