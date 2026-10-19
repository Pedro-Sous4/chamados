const fs = require('fs');
let c = fs.readFileSync('c:/chamados/org/laghetto-org-chart/src/components/OrgChart.jsx', 'utf-8');

c = c.replace(
  /const OrgChart = \(\{ data, onSelect, isAdmin, onMoveCard \}\) => \{/,
  "const OrgChart = ({ data, onSelect, isAdmin, onMoveCard, onRenameSector }) => {"
);

c = c.replace(
  /<div className="bg-black\/60 border border-laghetto-gold\/50 text-laghetto-gold px-4 py-1 rounded-full mb-4 text-sm font-bold tracking-wider backdrop-blur-sm whitespace-nowrap">\s*\{s\.nome\}\s*<\/div>/,
  `<div className="bg-black/60 border border-laghetto-gold/50 text-laghetto-gold px-4 py-1 rounded-full mb-4 text-sm font-bold tracking-wider backdrop-blur-sm whitespace-nowrap flex items-center gap-2">
              {s.nome}
              {isAdmin && (
                <button onClick={(e) => { e.stopPropagation(); if (onRenameSector) onRenameSector(s.nome); }} className="hover:text-white" title="Renomear Setor">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                </button>
              )}
            </div>`
);

fs.writeFileSync('c:/chamados/org/laghetto-org-chart/src/components/OrgChart.jsx', c, 'utf-8');
console.log("Fixed OrgChart.jsx");
