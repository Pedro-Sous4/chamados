const fs = require('fs');

// Modal.jsx
let modal = fs.readFileSync('c:/chamados/org/laghetto-org-chart/src/components/Modal.jsx', 'utf-8');
modal = modal.replace(
  /const Modal = \(\{ colaborador, onClose \}\) => \{/,
  "const Modal = ({ colaborador, onClose, tickets = [] }) => {\n  const colabTel = String(colaborador.telefone || '').replace(/\\D/g, '');\n  const myTickets = tickets.filter(t => t.status !== 'concluido' && t.status !== 'cancelado' && String(t.number || '').replace(/\\D/g, '').endsWith(colabTel));"
);

// Remove Ramal and ID Figuração blocks
modal = modal.replace(/<div className="border border-laghetto-gold\/20[\s\S]*?RAMAL[\s\S]*?<\/div>/, '');
modal = modal.replace(/<div className="border border-laghetto-gold\/20[\s\S]*?ID FIGURAÇÃO[\s\S]*?<\/div>/, '');

const ticketsUI = `
        {myTickets.length > 0 && (
          <div className="mt-6 border border-red-500/50 bg-red-500/10 rounded-lg p-4">
            <h3 className="text-red-400 text-xs font-bold mb-3 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              Chamados em Aberto ({myTickets.length})
            </h3>
            <ul className="space-y-3">
              {myTickets.map(t => (
                <li key={t.id} className="text-sm">
                  <div className="text-white font-bold">#{t.id} - {t.type}</div>
                  <div className="text-gray-400 text-xs mt-1">{t.description}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {colaborador.telefone && (
          <a href={\`https://wa.me/\${colabTel}\`} target="_blank" rel="noreferrer" className="mt-6 flex items-center justify-center gap-2 w-full bg-[#25D366]/20 hover:bg-[#25D366]/40 text-[#25D366] border border-[#25D366]/50 py-3 rounded-lg transition-colors font-bold">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
            Chamar no WhatsApp
          </a>
        )}
`;

modal = modal.replace(
  /\{colaborador\.email && \(/,
  ticketsUI + '\n        {colaborador.email && ('
);

// Format the Equipamentos display to show checkboxes properly
modal = modal.replace(
  /<p className="text-white text-sm whitespace-pre-wrap">\{colaborador\.equipamentos\}<\/p>/,
  `<div className="text-white text-sm flex flex-col gap-1">
              {typeof colaborador.equipamentos === 'object' ? (
                <>
                  {colaborador.equipamentos.notebook && <div>✓ Notebook</div>}
                  {colaborador.equipamentos.monitor > 0 && <div>✓ Monitor ({colaborador.equipamentos.monitor}x)</div>}
                  {colaborador.equipamentos.mouse && <div>✓ Mouse</div>}
                  {colaborador.equipamentos.teclado && <div>✓ Teclado</div>}
                  {colaborador.equipamentos.fone && <div>✓ Fone</div>}
                  {colaborador.equipamentos.cpu && <div>✓ CPU</div>}
                </>
              ) : (
                <p className="whitespace-pre-wrap">{colaborador.equipamentos}</p>
              )}
            </div>`
);

fs.writeFileSync('c:/chamados/org/laghetto-org-chart/src/components/Modal.jsx', modal, 'utf-8');

// EditModal.jsx
let editModal = fs.readFileSync('c:/chamados/org/laghetto-org-chart/src/components/EditModal.jsx', 'utf-8');

editModal = editModal.replace(
  /const handleChange = \(e\) => \{[\s\S]*?\};/,
  `const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('eq_')) {
       const eqName = name.replace('eq_', '');
       setFormData(prev => ({
         ...prev,
         equipamentos: {
           ...(typeof prev.equipamentos === 'object' ? prev.equipamentos : {}),
           [eqName]: type === 'checkbox' ? checked : value
         }
       }));
       return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };`
);

editModal = editModal.replace(/<label className="block text-gray-300 mb-1 text-sm">Ramal<\/label>[\s\S]*?<\/div>/, '');

const eqInput = `
            <label className="block text-gray-300 mb-2">Equipamentos de TI (Inventário)</label>
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
            </div>
`;

editModal = editModal.replace(
  /<label className="block text-gray-300 mb-1">Equipamentos de TI \(Inventário\)<\/label>[\s\S]*?<\/textarea>/,
  eqInput
);

fs.writeFileSync('c:/chamados/org/laghetto-org-chart/src/components/EditModal.jsx', editModal, 'utf-8');

console.log('Fixed Modals');
