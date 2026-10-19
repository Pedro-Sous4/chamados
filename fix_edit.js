const fs = require('fs');
let c = fs.readFileSync('c:/chamados/org/laghetto-org-chart/src/components/EditModal.jsx', 'utf-8');

const replacement = `
    // Update in Setores
    if (!found) {
      const updateRecursive = (sectors) => {
        if (!sectors) return;
        sectors.forEach(setor => {
          if (setor.colaboradores) {
            setor.colaboradores = setor.colaboradores.map(c => {
              if (c.id === formData.id) return formData;
              return c;
            });
          }
          if (setor.subsetores) {
            updateRecursive(setor.subsetores);
          }
        });
      };
      updateRecursive(newData.setores);
    }
`;

c = c.replace(
  /\/\/\s*Update in Setores\s*if \(!found\) \{[\s\S]*?\n    \}/,
  replacement.trim()
);

fs.writeFileSync('c:/chamados/org/laghetto-org-chart/src/components/EditModal.jsx', c, 'utf-8');
console.log("Fixed EditModal.jsx");
