import React from 'react';

const Card = ({ searchTerm = '', colaborador, onClick, isCenter = false, isAdmin = false, tickets = [] }) => {
  const fallbackImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(colaborador.nome)}&background=1e3a8a&color=ffffff&size=200`;

  // Verifica tickets ativos e determina prioridade de status (aberto = vermelho, em_atendimento = amarelo)
  const activeTickets = tickets.filter(t => {
      if (t.status === 'concluido' || t.status === 'cancelado' || t.status === 'arquivado') return false;
      if (t.solicitanteNome && t.solicitanteNome.toLowerCase() === (colaborador.nome || '').toLowerCase()) return true;
      const colabTel = String(colaborador.telefone || '').replace(/\D/g, '');
      const tNum = String(t.number || '').replace(/\D/g, '');
      if (!colabTel || !tNum) return false;
      return tNum.endsWith(colabTel) || colabTel.endsWith(tNum);
  });

  const hasAberto = activeTickets.some(t => t.status === 'aberto' || !t.status);
  const hasEmAtendimento = !hasAberto && activeTickets.some(t => t.status === 'em_atendimento' || t.status === 'em_andamento');

  const handleDragStart = (e) => {
    if (!isAdmin) return;
    e.dataTransfer.setData('colabId', colaborador.id);
  };

  
  const isMatch = searchTerm.length > 2 && colaborador.nome && colaborador.nome.toLowerCase().includes(searchTerm.toLowerCase());
  const isMuted = searchTerm.length > 2 && !isMatch;
  return (
    <div 
      draggable={isAdmin}
      onDragStart={handleDragStart}
      id={`card-${colaborador.id}`} data-name={colaborador.nome} className={`colab-card relative group ${isMatch ? 'search-match ring-4 ring-blue-500 scale-125 z-40' : ''} ${hasAberto ? 'animate-pulse ring-4 ring-red-500 rounded-lg' : hasEmAtendimento ? 'animate-pulse ring-4 ring-amber-400 rounded-lg' : ''} ${isMuted ? 'opacity-30 grayscale' : 'opacity-100'} cursor-pointer transition-all duration-300 ease-in-out hover:scale-110 hover:z-50 ${isCenter ? 'w-32 h-44' : 'w-24 h-32 md:w-28 md:h-40'} ${isAdmin ? 'cursor-grab active:cursor-grabbing' : ''}`}
      onClick={() => onClick(colaborador)}
    >
      <div className="absolute inset-0 bg-laghetto-gold/0 group-hover:bg-laghetto-gold/20 blur-xl rounded-lg transition-all duration-300"></div>
      
      <div className={`relative w-full h-full bg-white dark:bg-[#111c33] border-2 ${isAdmin ? 'border-dashed border-[#3b82f6]/50 hover:border-solid' : 'border-[#2563eb] dark:border-[#3b82f6]/70'} rounded-xl shadow-md dark:shadow-xl overflow-hidden flex flex-col items-center p-1 transition-all duration-300 group-hover:shadow-[0_0_15px_rgba(37,99,235,0.35)] dark:group-hover:shadow-[0_0_15px_rgba(59,130,246,0.45)]`}>
        
        <div className="w-full h-3/4 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center overflow-hidden border border-[#3b82f6]/20 relative">
          <img 
            src={colaborador.foto} 
            onError={(e) => { e.target.onerror = null; e.target.src = fallbackImage }} 
            alt={colaborador.nome}
            className="w-full h-full object-cover pointer-events-none"
          />
          {colaborador.rustdesk_id && (
            <div 
              className="absolute top-1 right-1 bg-blue-600/90 text-white p-0.5 rounded shadow-md border border-white/40"
              title={`Acesso Remoto Configurado (ID: ${colaborador.rustdesk_id})`}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
            </div>
          )}
        </div>

        <div className="w-full h-1/4 mt-1 flex flex-col items-center justify-center text-center">
          <p className="text-[#0f172a] dark:text-[#f8fafc] text-[10px] md:text-xs font-bold leading-tight truncate w-full px-1">{colaborador.nome}</p>
          <p className="text-[#2563eb] dark:text-[#93c5fd] text-[8px] md:text-[10px] uppercase font-semibold tracking-wider truncate w-full px-1">{colaborador.cargo}</p>
        </div>
      </div>
    </div>
  );
};

export default Card;


