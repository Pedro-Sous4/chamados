const fs = require('fs');

let html = fs.readFileSync('site/public/dashboard.html', 'utf8');

// 1. Injetar suporte a html.dark nas variáveis CSS
const oldCssRoot = `        :root {
            --bg: #f8fafc;
            --card-bg: #ffffff;
            --primary: #1e3a8a;
            --primary-accent: #3b82f6;
            --primary-light: #eff6ff;
            --text-main: #0f172a;
            --text-muted: #64748b;
            --border-color: #e2e8f0;
            --border-focus: #93c5fd;
            --status-aberto: #d97706;
            --status-atendimento: #2563eb;
            --status-concluido: #16a34a;
        }`;

const newCssRoot = `        :root {
            /* Modo Claro Executivo */
            --bg: #f8fafc;
            --card-bg: #ffffff;
            --primary: #1e3a8a;
            --primary-accent: #3b82f6;
            --primary-light: #eff6ff;
            --text-main: #0f172a;
            --text-muted: #64748b;
            --border-color: #e2e8f0;
            --border-focus: #93c5fd;
            --status-aberto: #d97706;
            --status-atendimento: #2563eb;
            --status-concluido: #16a34a;
            --input-bg: #ffffff;
            --table-th-bg: #f8fafc;
            --chart-grid: #f1f5f9;
            --badge-bg: #eff6ff;
        }

        html.dark {
            /* Modo Escuro Executivo (Deep Slate Navy & Ice Blue) */
            --bg: #0b1120;
            --card-bg: #111c33;
            --primary: #60a5fa;
            --primary-accent: #3b82f6;
            --primary-light: #172554;
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
            --border-color: rgba(59, 130, 246, 0.20);
            --border-focus: #60a5fa;
            --status-aberto: #f59e0b;
            --status-atendimento: #3b82f6;
            --status-concluido: #22c55e;
            --input-bg: #0b1120;
            --table-th-bg: #15223e;
            --chart-grid: rgba(59, 130, 246, 0.12);
            --badge-bg: #1e293b;
        }

        html.dark input[type="date"] {
            background: var(--input-bg);
            color: var(--text-main);
            border-color: var(--border-color);
            color-scheme: dark;
        }

        html.dark .btn-secondary {
            background: var(--card-bg);
            color: var(--text-main);
            border-color: var(--border-color);
        }
        html.dark .btn-secondary:hover {
            background: #172554;
            color: #60a5fa;
        }

        html.dark .btn-download {
            background: var(--card-bg);
            border-color: var(--border-color);
            color: var(--text-muted);
        }
        html.dark .btn-download:hover {
            color: #60a5fa;
            border-color: #3b82f6;
        }

        html.dark .ranking-item {
            border-bottom-color: rgba(59, 130, 246, 0.15) !important;
        }

        html.dark .theme-btn-toggle {
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            color: var(--text-main);
        }`;

html = html.replace(oldCssRoot, newCssRoot);

// 2. Adicionar botão de alternância de tema no header
const oldHeaderButtons = `            <button class="btn-action btn-pdf" id="btnExportPDF" onclick="generateExecutivePDF()">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                Gerar Relatório Executivo (PDF)
            </button>`;

const newHeaderButtons = `            <button class="btn-action btn-pdf" id="btnExportPDF" onclick="generateExecutivePDF()">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                Gerar Relatório Executivo (PDF)
            </button>
            <button id="btnThemeToggle" class="btn-action btn-secondary" onclick="toggleTheme()" title="Alternar Modo Claro / Escuro" style="padding: 0.5rem 0.75rem;">
                <span id="themeIcon">🌙</span>
            </button>`;

html = html.replace(oldHeaderButtons, newHeaderButtons);

// 3. Atualizar renderização de keywords e ranking com suporte a dark mode
html = html.replace(
  `return \`<span style="font-size: \${size}rem; background: #eff6ff; padding: 0.35rem 0.85rem; border-radius: 2rem; border: 1px solid #bfdbfe; color: #1e3a8a; font-weight: 600;">\${word}</span>\`;`,
  `const isDark = document.documentElement.classList.contains('dark');
            const bg = isDark ? '#1e293b' : '#eff6ff';
            const bColor = isDark ? 'rgba(59, 130, 246, 0.3)' : '#bfdbfe';
            const tColor = isDark ? '#93c5fd' : '#1e3a8a';
            return \`<span style="font-size: \${size}rem; background: \${bg}; padding: 0.35rem 0.85rem; border-radius: 2rem; border: 1px solid \${bColor}; color: \${tColor}; font-weight: 600;">\${word}</span>\`;`
);

// 4. Injetar script de persistência e alternância de tema no dashboard
const themeScript = `
    // Gerenciamento de Tema Claro / Escuro sincronizado
    function applyDashboardTheme(isDark) {
        if (isDark) {
            document.documentElement.classList.add('dark');
            const icon = document.getElementById('themeIcon');
            if (icon) icon.innerText = '☀️';
            localStorage.setItem('laghetto_theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            const icon = document.getElementById('themeIcon');
            if (icon) icon.innerText = '🌙';
            localStorage.setItem('laghetto_theme', 'light');
        }
        if (currentStats) {
            renderKeywords(currentStats.palavrasChave || {});
            if (charts.meses) {
                const tickColor = isDark ? '#94a3b8' : '#334155';
                const gridColor = isDark ? 'rgba(59, 130, 246, 0.12)' : '#f1f5f9';
                charts.meses.options.scales.x.ticks.color = tickColor;
                charts.meses.options.scales.y.grid.color = gridColor;
                charts.meses.update();
            }
            if (charts.tipos) {
                const tickColor = isDark ? '#94a3b8' : '#334155';
                charts.tipos.options.scales.y.ticks.color = tickColor;
                charts.tipos.update();
            }
        }
    }

    function toggleTheme() {
        const isDark = document.documentElement.classList.contains('dark');
        applyDashboardTheme(!isDark);
    }

    const savedTheme = localStorage.getItem('laghetto_theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyDashboardTheme(savedTheme ? savedTheme === 'dark' : prefersDark);
`;

html = html.replace('// Inicialização de datas e carregamento inicial', themeScript + '\n    // Inicialização de datas e carregamento inicial');

fs.writeFileSync('site/public/dashboard.html', html, 'utf8');
console.log('site/public/dashboard.html updated with Dark/Light theme toggle & colors!');
