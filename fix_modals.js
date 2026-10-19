const fs = require('fs');

// Modal.jsx
let c1 = fs.readFileSync('c:/chamados/org/laghetto-org-chart/src/components/Modal.jsx', 'utf-8');
c1 = c1.replace(
  /\{colaborador\.email && \(/,
  `{colaborador.equipamentos && (
          <div className="mb-4">
            <h3 className="text-laghetto-gold/70 text-xs font-bold mb-1 uppercase tracking-wider">Equipamentos de TI (Inventário)</h3>
            <p className="text-white text-sm whitespace-pre-wrap">{colaborador.equipamentos}</p>
          </div>
        )}
        {colaborador.email && (`
);
fs.writeFileSync('c:/chamados/org/laghetto-org-chart/src/components/Modal.jsx', c1, 'utf-8');

// EditModal.jsx
let c2 = fs.readFileSync('c:/chamados/org/laghetto-org-chart/src/components/EditModal.jsx', 'utf-8');
c2 = c2.replace(
  /<\/div>\s*<div className="flex justify-between pt-4">/,
  `</div>
          <div>
            <label className="block text-gray-300 mb-1">Equipamentos de TI (Inventário)</label>
            <textarea name="equipamentos" value={formData.equipamentos || ''} onChange={handleChange} placeholder="Ex: Notebook Dell Tag #3939, Celular Corporativo" className="w-full bg-black/50 border border-laghetto-gold/30 rounded p-2 text-white h-20" />
          </div>
          <div className="flex justify-between pt-4">`
);
fs.writeFileSync('c:/chamados/org/laghetto-org-chart/src/components/EditModal.jsx', c2, 'utf-8');

console.log('Fixed Modals');
