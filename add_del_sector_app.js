const fs = require('fs');
let c = fs.readFileSync('c:/chamados/org/laghetto-org-chart/src/App.jsx', 'utf-8');

const handleDeleteSectorCode = `
  const handleDeleteSector = (sectorName) => {
    if (!window.confirm(\`ATENÇÃO! Tem certeza que deseja EXCLUIR o setor "\${sectorName}"?\\n\\nTodos os funcionários e subsetores dentro dele também serão excluídos permanentemente!\`)) return;
    
    let newData = JSON.parse(JSON.stringify(data));
    
    const removeRecursive = (list) => {
      if (!list) return false;
      const idx = list.findIndex(s => s.nome === sectorName);
      if (idx !== -1) {
        list.splice(idx, 1);
        return true;
      }
      for (let s of list) {
        if (s.subsetores && removeRecursive(s.subsetores)) return true;
      }
      return false;
    };
    
    removeRecursive(newData.setores);
    handleSave(newData);
  };

  const renderSectorOptions =`;

c = c.replace(
  /const renderSectorOptions =/,
  handleDeleteSectorCode
);

c = c.replace(
  /<OrgChart data=\{data\} onSelect=\{handleSelect\} isAdmin=\{isAdmin\} onMoveCard=\{handleMoveCard\} onRenameSector=\{handleRenameSector\} \/>/,
  `<OrgChart data={data} onSelect={handleSelect} isAdmin={isAdmin} onMoveCard={handleMoveCard} onRenameSector={handleRenameSector} onDeleteSector={handleDeleteSector} />`
);

fs.writeFileSync('c:/chamados/org/laghetto-org-chart/src/App.jsx', c, 'utf-8');
console.log("Updated App.jsx");
