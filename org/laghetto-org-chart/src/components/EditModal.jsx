import React, { useState } from 'react';
import { X, Upload, Save } from 'lucide-react';

const EditModal = ({ colaborador, fullData, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState({ ...colaborador });
  const [uploading, setUploading] = useState(false);

  const handleChange = (e) => {
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
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      try {
        const res = await fetch('/api/upload-figurinha', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ foto: base64, nome: file.name }),
        });
        const json = await res.json();
        if (json.url) {
          setFormData(prev => ({ ...prev, foto: json.url }));
        }
      } catch (err) {
        console.error('Failed to upload image', err);
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };


  const handleSubmit = (e) => {
    e.preventDefault();
    let newData = JSON.parse(JSON.stringify(fullData));
    
    // Update in LideranÃ§a
    let found = false;
    newData.lideranca = newData.lideranca.map(c => {
      if (c.id === formData.id) { found = true; return formData; }
      return c;
    });

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

    onSave(newData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-laghetto-wine border-2 border-dashed border-laghetto-gold p-6 rounded-xl w-full max-w-lg shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={24} />
        </button>
        <h2 className="text-2xl text-laghetto-gold font-bold mb-4 flex items-center gap-2">
          Editar Colaborador
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div className="flex gap-4 items-center">
            <div className="w-24 h-32 bg-gray-800 border border-laghetto-gold/50 rounded overflow-hidden">
              <img src={formData.foto} alt="Preview" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <label className="block text-gray-300 mb-1">Atualizar Foto</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={uploading}
                className="w-full text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-laghetto-gold file:text-laghetto-wine hover:file:bg-white"
              />
              {uploading && <span className="text-xs text-laghetto-gold mt-1 block">Enviando...</span>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 mb-1">Nome</label>
              <input name="nome" value={formData.nome} onChange={handleChange} className="w-full bg-black/50 border border-laghetto-gold/30 rounded p-2 text-white" required />
            </div>
            <div>
              <label className="block text-gray-300 mb-1">Cargo</label>
              <input list="cargos-list" name="cargo" value={formData.cargo} onChange={handleChange} className="w-full bg-black/50 border border-laghetto-gold/30 rounded p-2 text-white" required />
              <datalist id="cargos-list">
                <option value="Diretor(a)" />
                <option value="Gerente" />
                <option value="Coordenador(a)" />
                <option value="Supervisor(a)" />
                <option value="Analista" />
                <option value="Assistente" />
                <option value="Auxiliar" />
                <option value="Estagiário(a)" />
              </datalist>
            </div>
            <div>
              <label className="block text-gray-300 mb-1">Apelido (opcional)</label>
              <input name="apelido" value={formData.apelido || ''} onChange={handleChange} className="w-full bg-black/50 border border-laghetto-gold/30 rounded p-2 text-white" />
            </div>
            <div>
              <label className="block text-gray-300 mb-1">Ramal</label>
              <input name="ramal" value={formData.ramal || ''} onChange={handleChange} className="w-full bg-black/50 border border-laghetto-gold/30 rounded p-2 text-white" />
            </div>
            <div>
              <label className="block text-gray-300 mb-1">E-mail</label>
              <input name="email" type="email" value={formData.email || ''} onChange={handleChange} className="w-full bg-black/50 border border-laghetto-gold/30 rounded p-2 text-white" />
            </div>
            <div>
              <label className="block text-gray-300 mb-1">Telefone / WhatsApp</label>
              <input name="telefone" value={formData.telefone || ''} onChange={handleChange} placeholder="Ex: 51999999999" className="w-full bg-black/50 border border-laghetto-gold/30 rounded p-2 text-white" />
            </div>
            <div>
              <label className="block text-blue-300 mb-1 font-semibold flex items-center gap-1">
                <span>🖥️ RustDesk ID (Acesso Remoto)</span>
              </label>
              <input 
                name="rustdesk_id" 
                value={formData.rustdesk_id || ''} 
                onChange={handleChange} 
                placeholder="Ex: 123 456 789 ou 123456789" 
                className="w-full bg-blue-950/40 border border-blue-400/40 rounded p-2 text-white font-mono placeholder:text-gray-500" 
              />
            </div>
            <div>
              <label className="block text-blue-300 mb-1 font-semibold flex items-center gap-1">
                <span>Nome da Máquina / Host (Alias)</span>
              </label>
              <input 
                name="rustdesk_alias" 
                value={formData.rustdesk_alias || ''} 
                onChange={handleChange} 
                placeholder="Ex: PC-VENDAS-01 ou DESKTOP-TI" 
                className="w-full bg-blue-950/40 border border-blue-400/40 rounded p-2 text-white placeholder:text-gray-500" 
              />
            </div>
          </div>
          <div>
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
          </div>
          <div className="flex justify-between pt-4">
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
        </form>
      </div>
    </div>
  );
};

export default EditModal;


