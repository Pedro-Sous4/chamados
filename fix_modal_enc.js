const fs = require('fs');
let c = fs.readFileSync('c:/chamados/org/laghetto-org-chart/src/components/Modal.jsx', 'utf-8');

c = c.replace(/HistÃ³rico de Chamados TI/g, 'Histórico de Chamados TI');
c = c.replace(/O robÃ´ serÃ¡ desativado automaticamente/g, 'O robô será desativado automaticamente');
c = c.replace(/âœ“/g, '✓');
c = c.replace(/Conversar pelo Painel/g, 'Conversar pelo Chat');
c = c.replace(/NÃ£o cadastrado/g, 'Não cadastrado');

fs.writeFileSync('c:/chamados/org/laghetto-org-chart/src/components/Modal.jsx', c, 'utf-8');
console.log('Fixed Modal');
