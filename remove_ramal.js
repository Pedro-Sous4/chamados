const fs = require('fs');
let c = fs.readFileSync('c:/chamados/org/laghetto-org-chart/src/components/EditModal.jsx', 'utf-8');

const ramalBlock = `<div>
              <label className="block text-gray-300 mb-1 text-sm">Ramal</label>
              <input type="text" name="ramal" value={formData.ramal || ''} onChange={handleChange} className="w-full bg-black/50 border border-laghetto-gold/30 rounded px-3 py-2 text-white" />
            </div>`;

// Or maybe it's corrupted too?
c = c.replace(/<div>\s*<label className="block text-gray-300 mb-1 text-sm">Ramal<\/label>[\s\S]*?<\/div>/g, '');

fs.writeFileSync('c:/chamados/org/laghetto-org-chart/src/components/EditModal.jsx', c, 'utf-8');
console.log('Removed Ramal from EditModal');
