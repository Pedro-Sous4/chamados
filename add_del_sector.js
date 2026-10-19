const fs = require('fs');
let c = fs.readFileSync('c:/chamados/org/laghetto-org-chart/src/components/OrgChart.jsx', 'utf-8');

c = c.replace(
  /const OrgChart = \(\{ data, onSelect, isAdmin, onMoveCard, onRenameSector \}\) => \{/,
  "const OrgChart = ({ data, onSelect, isAdmin, onMoveCard, onRenameSector, onDeleteSector }) => {"
);

const trashIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;

c = c.replace(
  /\{isAdmin && \([\s\S]*?<\/button>\s*\)\}/,
  `{isAdmin && (
              <>
                <button onClick={(e) => { e.stopPropagation(); if (onRenameSector) onRenameSector(s.nome); }} className="hover:text-white transition-colors" title="Renomear Setor">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                </button>
                <button onClick={(e) => { e.stopPropagation(); if (onDeleteSector) onDeleteSector(s.nome); }} className="text-red-400 hover:text-red-300 transition-colors" title="Excluir Setor">
                  ${trashIcon}
                </button>
              </>
            )}`
);

fs.writeFileSync('c:/chamados/org/laghetto-org-chart/src/components/OrgChart.jsx', c, 'utf-8');
console.log("Updated OrgChart.jsx");
