const fs = require('fs');
let c = fs.readFileSync('c:/chamados/org/laghetto-org-chart/src/App.jsx', 'utf-8');

c = c.replace(
  /const \[dragOverSector, setDragOverSector\] = useState\(null\);/,
  `const [searchTerm, setSearchTerm] = useState('');`
);

const searchFunc = `
  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (term.length > 2) {
       const cards = document.querySelectorAll('.colab-card');
       let found = false;
       cards.forEach(c => {
         if (c.dataset.name && c.dataset.name.toLowerCase().includes(term.toLowerCase())) {
           if (!found) {
             c.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
             found = true;
           }
           c.style.boxShadow = '0 0 20px #f3e5ab';
         } else {
           c.style.boxShadow = 'none';
         }
       });
    } else {
       document.querySelectorAll('.colab-card').forEach(c => c.style.boxShadow = 'none');
    }
  };
`;

c = c.replace(/const handleSelect = \(colaborador\) => \{/, searchFunc + '\n  const handleSelect = (colaborador) => {');

const searchBarHTML = `
        {isAdmin && (
          <div className="absolute right-24 top-0 flex gap-2">`;

c = c.replace(
  /\{isAdmin && \(\s*<div className="absolute right-24 top-0 flex gap-2">/,
  `<div className="absolute left-10 top-0 flex items-center bg-black/40 border border-laghetto-gold/30 rounded-full px-4 py-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f3e5ab" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input 
            type="text" 
            placeholder="Buscar colaborador..." 
            value={searchTerm}
            onChange={handleSearch}
            className="bg-transparent border-none outline-none text-laghetto-gold ml-2 w-64 placeholder-laghetto-gold/50"
          />
        </div>
        {isAdmin && (
          <div className="absolute right-24 top-0 flex gap-2">`
);

const ticketTrigger = `
        targetSetor.colaboradores.push(colabToMove);
        handleSave(newData);

        // Gatilho de TI Automático
        if (colabToMove.setor && colabToMove.setor !== newSetorName) {
           fetch('/api/tickets', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
               name: 'Sistema RH (Organograma)',
               number: colabToMove.telefone || '00000000000',
               type: 'Dúvidas e Suporte',
               description: \`TRANSFERÊNCIA AUTOMÁTICA: O colaborador \${colabToMove.nome} foi transferido do setor "\${colabToMove.setor}" para o setor "\${newSetorName}". Favor revogar acessos antigos e liberar permissões do novo setor, conforme o cargo: \${colabToMove.cargo}\`
             })
           }).catch(console.error);
        }
`;

c = c.replace(
  /targetSetor\.colaboradores\.push\(colabToMove\);\s*handleSave\(newData\);/,
  ticketTrigger
);

fs.writeFileSync('c:/chamados/org/laghetto-org-chart/src/App.jsx', c, 'utf-8');
console.log('Fixed App.jsx');
