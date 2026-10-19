const fs = require('fs');
let c = fs.readFileSync('c:/chamados/org/laghetto-org-chart/src/App.jsx', 'utf-8');

c = c.replace(
  /const renderSectorOptions =/,
  `const handleDeleteColaborador = (colaboradorId) => {
    if (!window.confirm("Tem certeza que deseja excluir este colaborador?")) return;
    let newData = JSON.parse(JSON.stringify(data)); 
    let idx = newData.lideranca.findIndex(c => c.id === colaboradorId);
    if (idx !== -1) {
      newData.lideranca.splice(idx, 1);
    } else {
      findAndRemoveColab(newData.setores, colaboradorId);
    }
    handleSave(newData);
  };

  const handleRenameSector = (oldName) => {
    const newName = window.prompt("Digite o novo nome para o setor:", oldName);
    if (!newName || newName.trim() === '' || newName === oldName) return;
    
    let newData = JSON.parse(JSON.stringify(data));
    const targetSector = findSector(newData.setores, oldName);
    if (targetSector) {
      targetSector.nome = newName.trim();
      if (targetSector.colaboradores) {
        targetSector.colaboradores.forEach(c => c.setor = newName.trim());
      }
      handleSave(newData);
    }
  };

  const renderSectorOptions =`
);

c = c.replace(
  /<OrgChart data=\{data\} onSelect=\{handleSelect\} isAdmin=\{isAdmin\} onMoveCard=\{handleMoveCard\} \/>/,
  `<OrgChart data={data} onSelect={handleSelect} isAdmin={isAdmin} onMoveCard={handleMoveCard} onRenameSector={handleRenameSector} />`
);

c = c.replace(
  /<EditModal\s*colaborador=\{editingColaborador\}\s*fullData=\{data\}\s*onClose=\{handleCloseModal\}\s*onSave=\{handleSave\}\s*\/>/,
  `<EditModal 
          colaborador={editingColaborador} 
          fullData={data} 
          onClose={handleCloseModal} 
          onSave={handleSave} 
          onDelete={handleDeleteColaborador}
        />`
);

fs.writeFileSync('c:/chamados/org/laghetto-org-chart/src/App.jsx', c, 'utf-8');
console.log("Fixed App.jsx");
