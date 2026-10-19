const fs = require('fs');
let c = fs.readFileSync('c:/chamados/org/laghetto-org-chart/src/components/EditModal.jsx', 'utf-8');

const startStr = '<label className="block text-gray-300 mb-1">Equipamentos de TI';
const endStr = '/>';

const startIndex = c.indexOf(startStr);
if (startIndex !== -1) {
  // Find the next '/>' after the '<textarea'
  const textareaIndex = c.indexOf('<textarea', startIndex);
  if (textareaIndex !== -1) {
    const endIndex = c.indexOf(endStr, textareaIndex);
    if (endIndex !== -1) {
      const replacement = `<label className="block text-gray-300 mb-2">Equipamentos de TI (Inventário)</label>
            <div className="grid grid-cols-2 gap-4 bg-black/30 p-4 rounded border border-laghetto-gold/20">
              <label className="flex items-center gap-2 text-white">
                <input type="checkbox" name="eq_notebook" checked={formData.equipamentos?.notebook || false} onChange={handleChange} className="w-4 h-4" /> Notebook
              </label>
              <label className="flex items-center gap-2 text-white">
                <input type="number" name="eq_monitor" value={formData.equipamentos?.monitor || ''} onChange={handleChange} placeholder="Qtd" className="w-16 bg-black/50 border border-laghetto-gold/30 rounded px-2 py-1 text-white text-sm" /> Monitores
              </label>
              <label className="flex items-center gap-2 text-white">
                <input type="checkbox" name="eq_mouse" checked={formData.equipamentos?.mouse || false} onChange={handleChange} className="w-4 h-4" /> Mouse
              </label>
              <label className="flex items-center gap-2 text-white">
                <input type="checkbox" name="eq_teclado" checked={formData.equipamentos?.teclado || false} onChange={handleChange} className="w-4 h-4" /> Teclado
              </label>
              <label className="flex items-center gap-2 text-white">
                <input type="checkbox" name="eq_fone" checked={formData.equipamentos?.fone || false} onChange={handleChange} className="w-4 h-4" /> Fone
              </label>
              <label className="flex items-center gap-2 text-white">
                <input type="checkbox" name="eq_cpu" checked={formData.equipamentos?.cpu || false} onChange={handleChange} className="w-4 h-4" /> CPU
              </label>
            </div>`;
      c = c.substring(0, startIndex) + replacement + c.substring(endIndex + endStr.length);
      fs.writeFileSync('c:/chamados/org/laghetto-org-chart/src/components/EditModal.jsx', c, 'utf-8');
      console.log('Replaced successfully by substring!');
    }
  }
}
