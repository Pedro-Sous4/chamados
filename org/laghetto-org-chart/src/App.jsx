import React, { useState, useEffect } from 'react';
import OrgChart from './components/OrgChart';
import Modal from './components/Modal';
import EditModal from './components/EditModal';
import { Settings, Sun, Moon, ArrowLeft, Ticket } from 'lucide-react';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [data, setData] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [selectedColaborador, setSelectedColaborador] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingColaborador, setEditingColaborador] = useState(null);
  const [isAddingColab, setIsAddingColab] = useState(false);

  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('laghetto_theme');
    if (saved) return saved === 'dark';
    return true; // default dark in org chart
  });

  useEffect(() => {
    localStorage.setItem('laghetto_theme', isDark ? 'dark' : 'light');
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);


  const loadData = async () => {
    try {
      const res = await fetch('/api/colaboradores');
      const json = await res.json();
      setData(json);
      try {
        const resTickets = await fetch('/api/tickets');
        const jsonTickets = await resTickets.json();
        setTickets(jsonTickets.tickets || []);
      } catch (err) {}
    } catch (e) {
      console.error('Failed to load data', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
const handleSelect = (colaborador) => {
    if (isAdmin) {
      setEditingColaborador(colaborador);
    } else {
      setSelectedColaborador(colaborador);
    }
  };

  const handleCloseModal = () => {
    setSelectedColaborador(null);
    setEditingColaborador(null);
  };

  const handleSave = async (updatedData) => {
    await fetch('/api/colaboradores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData)
    });
    setData(updatedData);
    handleCloseModal();
  };

  const [isAddingSetor, setIsAddingSetor] = useState(false);

  const findSector = (setorList, name) => {
    for (let s of setorList) {
      if (s.nome === name) return s;
      if (s.subsetores) {
        const found = findSector(s.subsetores, name);
        if (found) return found;
      }
    }
    return null;
  };

  const findAndRemoveColab = (setorList, id) => {
    for (let s of setorList) {
      if (!s.colaboradores) s.colaboradores = [];
      let idx = s.colaboradores.findIndex(c => c.id === id);
      if (idx !== -1) {
        return s.colaboradores.splice(idx, 1)[0];
      }
      if (s.subsetores) {
        const colab = findAndRemoveColab(s.subsetores, id);
        if (colab) return colab;
      }
    }
    return null;
  };

  const handleConfirmAddSetor = (nome, parent) => {
    if (!nome || nome.trim() === '') return;
    
    let newData = JSON.parse(JSON.stringify(data));
    
    if (parent && parent !== 'NENHUM') {
      const parentSector = findSector(newData.setores, parent);
      if (parentSector) {
        if (!parentSector.subsetores) parentSector.subsetores = [];
        parentSector.subsetores.push({ nome, colaboradores: [], subsetores: [] });
      }
    } else {
      newData.setores.push({ nome, colaboradores: [], subsetores: [] });
    }
    handleSave(newData);
    setIsAddingSetor(false);
  };

  const handleConfirmAddColaborador = (nomeSetor) => {
    let newData = JSON.parse(JSON.stringify(data));
    const newColab = {
      id: "colab-" + Date.now(),
      nome: "Novo Colaborador",
      cargo: "Novo Cargo",
      setor: nomeSetor,
      email: "",
      telefone: "",
      ramal: "",
      apelido: "",
      foto: "/figurinhas/figurinha_pagina_001.png"
    };

    if (nomeSetor === 'LIDERANÇA' || nomeSetor === 'LIDERANÃ‡A') {
      newData.lideranca.push(newColab);
    } else {
      let targetSetor = findSector(newData.setores, nomeSetor);
      if (targetSetor) {
        if (!targetSetor.colaboradores) targetSetor.colaboradores = [];
        targetSetor.colaboradores.push(newColab);
      }
    }
    handleSave(newData);
    setIsAddingColab(false);
    setEditingColaborador(newColab);
  };

  const handleMoveCard = async (colaboradorId, newSetorName) => {
    if (!data) return;
    let newData = JSON.parse(JSON.stringify(data)); 

    let colabToMove = findAndRemoveColab(newData.setores, colaboradorId);

    if (colabToMove) {
      colabToMove.setor = newSetorName;
      let targetSetor = findSector(newData.setores, newSetorName);
      if (targetSetor) {
        if (!targetSetor.colaboradores) targetSetor.colaboradores = [];
        
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
               description: `TRANSFERÊNCIA AUTOMÁTICA: O colaborador ${colabToMove.nome} foi transferido do setor "${colabToMove.setor}" para o setor "${newSetorName}". Favor revogar acessos antigos e liberar permissões do novo setor, conforme o cargo: ${colabToMove.cargo}`
             })
           }).catch(console.error);
        }

      }
    }
  };



  const handleDeleteColaborador = (colaboradorId) => {
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

  
  const handleDeleteSector = (sectorName) => {
    if (!window.confirm(`ATENÇÃO! Tem certeza que deseja EXCLUIR o setor "${sectorName}"?\n\nTodos os funcionários e subsetores dentro dele também serão excluídos permanentemente!`)) return;
    
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

  const renderSectorOptions = (setorList, depth = 0) => {
    return setorList.map(s => (
      <React.Fragment key={s.nome}>
        <option value={s.nome}>{"\u00A0".repeat(depth * 4)}{depth > 0 ? '↳ ' : ''}{s.nome}</option>
        {s.subsetores && renderSectorOptions(s.subsetores, depth + 1)}
      </React.Fragment>
    ));
  };

  if (!data) return <div className="min-h-screen bg-laghetto-wine text-white flex items-center justify-center">Carregando...</div>;

  // Estatísticas de chamados no topo
  const ticketStats = React.useMemo(() => {
    let abertos = 0;
    let emAndamento = 0;
    (tickets || []).forEach(t => {
      if (t.status === 'concluido' || t.status === 'cancelado' || t.status === 'arquivado') return;
      if (t.status === 'aberto' || !t.status) abertos++;
      else if (t.status === 'em_atendimento' || t.status === 'em_andamento') emAndamento++;
    });
    return { abertos, emAndamento };
  }, [tickets]);

  return (
    <div className={`h-screen w-screen ${isDark ? 'bg-[#0b1120] text-[#f8fafc] org-dots-dark' : 'bg-[#f8fafc] text-[#0f172a] org-dots-light'} flex flex-col relative overflow-hidden transition-colors duration-300`}>
      <style>{`
        .org-dots-dark {
          background-image: radial-gradient(rgba(59, 130, 246, 0.25) 1.5px, transparent 1.5px);
          background-size: 24px 24px;
        }
        .org-dots-light {
          background-image: radial-gradient(rgba(37, 99, 235, 0.15) 1.5px, transparent 1.5px);
          background-size: 24px 24px;
        }
      `}</style>
      <header className={`shrink-0 z-20 w-full pt-3 pb-3 px-3 sm:px-6 flex flex-col gap-2.5 border-b ${isDark ? 'border-blue-500/20 bg-[#0f172a]/90' : 'border-slate-200 bg-[#1e3a8a] text-white shadow-md'} backdrop-blur-md`}>
        {/* Linha Superior: Logo/Voltar, Título Centralizado Absoluto e Ações */}
        <div className="relative flex items-center justify-between gap-2 w-full min-h-[38px]">
          {/* Lado Esquerdo: Botão Voltar + Badges Elegantes de Chamados */}
          <div className="flex items-center gap-2 sm:gap-3 z-10">
            <a
              href="/"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-xs transition-all shadow-md shrink-0 ${
                isDark 
                  ? 'bg-[#1e3a8a] hover:bg-[#2563eb] text-white border border-[#3b82f6]/40' 
                  : 'bg-white hover:bg-[#eff6ff] text-[#1e3a8a] border border-white/30'
              }`}
              title="Voltar para a Central de Chamados"
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Central de Chamados</span>
              <span className="sm:hidden">Voltar</span>
            </a>

            {/* Badges de Chamados no Canto Superior */}
            <div className="flex items-center gap-1.5">
              {ticketStats.abertos > 0 && (
                <div 
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border backdrop-blur-md transition-all shadow-sm ${
                    isDark
                      ? 'bg-red-500/15 border-red-500/40 text-red-400 shadow-red-500/10'
                      : 'bg-white/20 border-white/40 text-red-200 shadow-black/10'
                  }`}
                  title={`${ticketStats.abertos} chamado(s) em aberto`}
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  <span className="tracking-wide">
                    {ticketStats.abertos} <span className="hidden md:inline font-normal opacity-90">em aberto</span><span className="md:hidden">aberto</span>
                  </span>
                </div>
              )}

              {ticketStats.emAndamento > 0 && (
                <div 
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border backdrop-blur-md transition-all shadow-sm ${
                    isDark
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-amber-500/10'
                      : 'bg-white/20 border-white/40 text-amber-200 shadow-black/10'
                  }`}
                  title={`${ticketStats.emAndamento} chamado(s) em andamento / atendimento`}
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                  </span>
                  <span className="tracking-wide">
                    {ticketStats.emAndamento} <span className="hidden md:inline font-normal opacity-90">em andamento</span><span className="md:hidden">andamento</span>
                  </span>
                </div>
              )}

              {ticketStats.abertos === 0 && ticketStats.emAndamento === 0 && tickets.length > 0 && (
                <div 
                  className={`hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border backdrop-blur-md opacity-80 ${
                    isDark
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-white/15 border-white/30 text-emerald-100'
                  }`}
                  title="Nenhum chamado pendente no momento"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>Tudo em dia</span>
                </div>
              )}
            </div>
          </div>

          {/* Centro Perfeito: Título LAGHETTO absolutamente centralizado na barra */}
          <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none z-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-widest leading-none drop-shadow-sm">
              LAGHETTO
            </h1>
            <h2 className={`text-[10px] sm:text-xs font-medium mt-0.5 whitespace-nowrap ${isDark ? 'text-blue-200/90' : 'text-blue-100'}`}>
              Organograma de Talentos
            </h2>
          </div>

          {/* Lado Direito: Ações de Admin, Tema e Modos */}
          <div className="flex items-center gap-1.5 shrink-0 z-10">
            {isAdmin && (
              <div className="flex gap-1">
                <button 
                  onClick={() => setIsAddingSetor(true)}
                  className="bg-blue-500/20 text-white px-2 sm:px-3 py-1 rounded text-xs hover:bg-blue-500/40 transition border border-blue-400/40 font-bold"
                >
                  + Setor
                </button>
                <button 
                  onClick={() => setIsAddingColab(true)}
                  className="bg-blue-500/20 text-white px-2 sm:px-3 py-1 rounded text-xs hover:bg-blue-500/40 transition border border-blue-400/40 font-bold"
                >
                  + Colab
                </button>
              </div>
            )}

            <button 
              onClick={() => setIsDark(!isDark)}
              className={`p-1.5 sm:p-2 rounded-full transition-all ${isDark ? 'text-blue-400 hover:bg-white/10' : 'text-white hover:bg-white/20 bg-white/10'}`}
              title={isDark ? "Alternar para Tema Claro" : "Alternar para Tema Escuro"}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button 
              onClick={() => setIsAdmin(!isAdmin)}
              className={`p-1.5 sm:p-2 rounded-full transition-colors ${isAdmin ? 'bg-white text-[#1e3a8a]' : 'text-white hover:bg-white/10'}`}
              title="Modo Edição"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>

        {/* Linha Inferior: Barra de Busca Centralizada e Ampla no Celular */}
        <div className="w-full flex justify-center">
          <div className={`w-full max-w-md flex items-center ${isDark ? 'bg-[#111c33] border-blue-500/30 text-white' : 'bg-white border-blue-200 text-[#0f172a] shadow-sm'} border rounded-full px-3.5 py-1.5 transition-colors`}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-70 shrink-0"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input 
              type="text" 
              placeholder="Buscar colaborador no organograma..." 
              value={searchTerm}
              onChange={handleSearch}
              className={`bg-transparent border-none outline-none ml-2 w-full text-xs sm:text-sm ${isDark ? 'text-white placeholder-slate-400' : 'text-[#0f172a] placeholder-slate-400'}`}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="text-xs opacity-60 hover:opacity-100 p-0.5"
                title="Limpar busca"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </header>

      <main id="org-viewport" className="flex-1 w-full overflow-auto relative cursor-grab select-none">
        
        
        <OrgChart searchTerm={searchTerm} tickets={tickets} data={data} onSelect={handleSelect} isAdmin={isAdmin} onMoveCard={handleMoveCard} onRenameSector={handleRenameSector} onDeleteSector={handleDeleteSector} />
      </main>

      {selectedColaborador && (
        <Modal colaborador={selectedColaborador} onClose={handleCloseModal} tickets={tickets} />
      )}
      {editingColaborador && (
        <EditModal 
          colaborador={editingColaborador} 
          fullData={data} 
          onClose={handleCloseModal} 
          onSave={handleSave} 
          onDelete={handleDeleteColaborador}
        />
      )}
      
      {isAddingSetor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-laghetto-wine border-2 border-laghetto-gold p-6 rounded-xl w-full max-w-sm">
            <h2 className="text-xl text-laghetto-gold font-bold mb-4">Adicionar Setor</h2>
            
            <label className="block text-gray-300 mb-1 text-sm">Nome do Setor/Subsetor</label>
            <input 
              id="newSectorName"
              type="text"
              className="w-full bg-black/50 border border-laghetto-gold/30 rounded p-2 text-white mb-4"
              placeholder="Ex: Pós-Vendas Sul"
            />

            <label className="block text-gray-300 mb-1 text-sm">Setor Pai (Opcional)</label>
            <select 
              id="parentSectorSelect"
              className="w-full bg-black/50 border border-laghetto-gold/30 rounded p-2 text-white mb-6"
            >
              <option value="NENHUM">Nenhum (Criar como Setor Principal)</option>
              {renderSectorOptions(data.setores)}
            </select>
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setIsAddingSetor(false)}
                className="text-gray-400 hover:text-white px-4 py-2"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleConfirmAddSetor(document.getElementById('newSectorName').value, document.getElementById('parentSectorSelect').value)}
                className="bg-laghetto-gold text-laghetto-wine font-bold px-4 py-2 rounded"
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddingColab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-laghetto-wine border-2 border-laghetto-gold p-6 rounded-xl w-full max-w-sm">
            <h2 className="text-xl text-laghetto-gold font-bold mb-4">Selecione o Setor</h2>
            <select 
              id="sectorSelect"
              className="w-full bg-black/50 border border-laghetto-gold/30 rounded p-2 text-white mb-4"
            >
              <option value="LIDERANÇA">Liderança (Centro)</option>
              {renderSectorOptions(data.setores)}
            </select>
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setIsAddingColab(false)}
                className="text-gray-400 hover:text-white px-4 py-2"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleConfirmAddColaborador(document.getElementById('sectorSelect').value)}
                className="bg-laghetto-gold text-laghetto-wine font-bold px-4 py-2 rounded"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;




