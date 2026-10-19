const fs = require('fs');

let app = fs.readFileSync('c:/chamados/org/laghetto-org-chart/src/App.jsx', 'utf-8');
app = app.replace(/const handleSearch = \(e\) => \{[\s\S]*?\}\s*};\s*/, 
`const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (term.length > 2) {
      setTimeout(() => {
        const cards = document.querySelectorAll('.colab-card.search-match');
        if (cards.length > 0) {
          cards[0].scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }
      }, 100);
    }
  };
`);
app = app.replace(/<OrgChart tickets=\{tickets\}/, '<OrgChart searchTerm={searchTerm} tickets={tickets}');
fs.writeFileSync('c:/chamados/org/laghetto-org-chart/src/App.jsx', app, 'utf-8');

let org = fs.readFileSync('c:/chamados/org/laghetto-org-chart/src/components/OrgChart.jsx', 'utf-8');
org = org.replace(/const OrgChart = \(\{ tickets, data, onSelect, isAdmin, onMoveCard, onRenameSector, onDeleteSector \}\) => \{/, 
`const OrgChart = ({ searchTerm, tickets, data, onSelect, isAdmin, onMoveCard, onRenameSector, onDeleteSector }) => {`);
org = org.replace(/<Card\s+tickets=\{tickets\}\s+colaborador=\{colab\}/g, `<Card searchTerm={searchTerm} tickets={tickets} colaborador={colab}`);
org = org.replace(/<SectorNode\s+tickets=\{tickets\}/g, `<SectorNode searchTerm={searchTerm} tickets={tickets}`);
org = org.replace(/const SectorNode = \(\{ tickets, sector, onSelect, isAdmin, onMoveCard, onRenameSector, onDeleteSector \}\) => \{/, 
`const SectorNode = ({ searchTerm, tickets, sector, onSelect, isAdmin, onMoveCard, onRenameSector, onDeleteSector }) => {`);
fs.writeFileSync('c:/chamados/org/laghetto-org-chart/src/components/OrgChart.jsx', org, 'utf-8');

let card = fs.readFileSync('c:/chamados/org/laghetto-org-chart/src/components/Card.jsx', 'utf-8');
card = card.replace(/const Card = \(\{ colaborador, onClick, isCenter = false, isAdmin = false, tickets = \[\] \}\) => \{/, 
`const Card = ({ searchTerm = '', colaborador, onClick, isCenter = false, isAdmin = false, tickets = [] }) => {`);
card = card.replace(/return \(/, `
  const isMatch = searchTerm.length > 2 && colaborador.nome && colaborador.nome.toLowerCase().includes(searchTerm.toLowerCase());
  const isMuted = searchTerm.length > 2 && !isMatch;
  return (`);
card = card.replace(/className={\`colab-card relative group \$\{hasOpenTicket \? 'animate-pulse ring-4 ring-red-500 rounded-lg' : ''\} cursor-pointer transition-all duration-300 ease-in-out hover:scale-110 hover:z-50 \$\{isCenter \? 'w-32 h-44' : 'w-24 h-32 md:w-28 md:h-40'\} \$\{isAdmin \? 'cursor-grab active:cursor-grabbing' : ''\}\`}/,
`className={\`colab-card relative group \${isMatch ? 'search-match ring-4 ring-blue-500 scale-125 z-40' : ''} \${hasOpenTicket ? 'animate-pulse ring-4 ring-red-500 rounded-lg' : ''} \${isMuted ? 'opacity-30 grayscale' : 'opacity-100'} cursor-pointer transition-all duration-300 ease-in-out hover:scale-110 hover:z-50 \${isCenter ? 'w-32 h-44' : 'w-24 h-32 md:w-28 md:h-40'} \${isAdmin ? 'cursor-grab active:cursor-grabbing' : ''}\`}`
);
fs.writeFileSync('c:/chamados/org/laghetto-org-chart/src/components/Card.jsx', card, 'utf-8');
console.log('React search highlighting applied');
