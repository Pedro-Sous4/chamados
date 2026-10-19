const fs = require('fs');
let c = fs.readFileSync('c:/chamados/org/laghetto-org-chart/src/components/EditModal.jsx', 'utf-8');

c = c.replace(
  /<div className="flex justify-end pt-4">[\s\S]*?<\/form>/,
  `<div className="flex justify-between pt-4">
            <div>
              {onDelete && (
                <button type="button" onClick={() => onDelete(formData.id)} className="bg-red-600/20 text-red-400 border border-red-500/50 font-bold px-4 py-2 rounded hover:bg-red-600 hover:text-white transition-colors">
                  Excluir
                </button>
              )}
            </div>
            <button type="submit" className="bg-laghetto-gold text-laghetto-wine font-bold px-6 py-2 rounded flex items-center gap-2 hover:bg-white transition-colors">
              <Save size={18} /> Salvar Alterações
            </button>
          </div>
        </form>`
);

fs.writeFileSync('c:/chamados/org/laghetto-org-chart/src/components/EditModal.jsx', c, 'utf-8');
console.log("Done");
