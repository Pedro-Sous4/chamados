const fs = require('fs');
let c = fs.readFileSync('c:/chamados/org/laghetto-org-chart/src/components/Card.jsx', 'utf-8');
c = c.replace(/className=\{`relative group cursor-pointer/g, "id={`card-${colaborador.id}`} data-name={colaborador.nome} className={`colab-card relative group cursor-pointer");
fs.writeFileSync('c:/chamados/org/laghetto-org-chart/src/components/Card.jsx', c, 'utf-8');
console.log('Fixed Card.jsx');
