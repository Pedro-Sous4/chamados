import React, { useEffect, useState, useRef } from 'react';
import { X, Mail, Phone, Star, MessagesSquare, ChevronDown, ChevronUp, Send, Loader2, ArrowLeft, History } from 'lucide-react';

function normalizeString(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

const Modal = ({ colaborador, onClose, tickets = [] }) => {
  const [showTickets, setShowTickets] = useState(false);
  const [expandedTicketId, setExpandedTicketId] = useState(null);
  
  // Chat embutido direto no modal
  const [activeChatTicket, setActiveChatTicket] = useState(null);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatBottomRef = useRef(null);

  // Ativos e equipamentos vinculados pelo inventário de TI e cadastro
  const [colabAssets, setColabAssets] = useState([]);
  const [showAssets, setShowAssets] = useState(false);

  useEffect(() => {
    if (!colaborador?.nome) return;

    fetch('/api/inventario')
      .then(r => r.json())
      .then(data => {
        const cName = normalizeString(colaborador.nome);
        const assets = [];
        
        // Computadores
        (data.computadores || []).forEach(comp => {
          const resp = normalizeString(comp.responsavel);
          if (resp && (resp === cName || resp.includes(cName) || cName.includes(resp))) {
            assets.push({ ...comp, categoria: 'Computador' });
          }
        });

        // Periféricos
        (data.perifericos || []).forEach(p => {
          const resp = normalizeString(p.responsavel);
          if (resp && (resp === cName || resp.includes(cName) || cName.includes(resp))) {
            assets.push({ ...p, categoria: 'Periférico' });
          }
        });

        // Empréstimos
        (data.emprestimos || []).forEach(e => {
          const resp = normalizeString(e.solicitante);
          if (resp && (resp === cName || resp.includes(cName) || cName.includes(resp))) {
            assets.push({ ...e, categoria: 'Empréstimo' });
          }
        });

        setColabAssets(assets);
      })
      .catch(err => console.error('Erro ao buscar ativos do colaborador:', err));
  }, [colaborador?.nome]);

  // Lista unificada de equipamentos manuais (caso cadastrado via texto livre ou checklist no organograma)
  const manualEquipments = React.useMemo(() => {
    if (!colaborador?.equipamentos) return [];
    if (typeof colaborador.equipamentos === 'object') {
      const list = [];
      const eq = colaborador.equipamentos;
      if (eq.notebook) list.push({ tipo: 'Notebook', modelo: 'Notebook Corporativo', isManual: true });
      if (Number(eq.monitor) > 0) list.push({ tipo: 'Monitor', modelo: `Monitor (${eq.monitor}x)`, isManual: true });
      if (eq.cpu) list.push({ tipo: 'Desktop', modelo: 'Computador / CPU', isManual: true });
      if (eq.teclado) list.push({ tipo: 'Teclado', modelo: 'Teclado USB', isManual: true });
      if (eq.mouse) list.push({ tipo: 'Mouse', modelo: 'Mouse Óptico', isManual: true });
      if (eq.fone) list.push({ tipo: 'Headset', modelo: 'Headset / Fone', isManual: true });
      return list;
    }
    if (typeof colaborador.equipamentos === 'string' && colaborador.equipamentos.trim()) {
      // Texto livre quebrado por linhas
      return colaborador.equipamentos.split('\n').filter(l => l.trim()).map(line => ({
        tipo: 'Equipamento',
        modelo: line.trim(),
        isManual: true,
        isCustomText: true
      }));
    }
    return [];
  }, [colaborador?.equipamentos]);

  // Total combinado de itens na mochila
  const totalMochilaCount = colabAssets.length + manualEquipments.length;

  const colabTel = String(colaborador?.telefone || '').replace(/\D/g, '');
  const cNorm = normalizeString(colaborador?.nome);
  
  // Identificação robusta dos chamados pertencentes a este colaborador
  const myTickets = tickets.filter(t => {
    // 1. Pelo ID atribuído no backend
    if (t.colabId && colaborador?.id && String(t.colabId) === String(colaborador.id)) return true;
    
    // 2. Pelo nome normalizado
    const tSol = normalizeString(t.solicitanteNome);
    const tName = normalizeString(t.name);
    if (cNorm && (tSol === cNorm || tName === cNorm || tSol.includes(cNorm) || tName.includes(cNorm))) return true;
    
    // 3. Pelo telefone
    if (!colabTel) return false;
    const tNum = String(t.number || '').replace(/\D/g, '');
    const tReal = String(t.realNumber || '').replace(/\D/g, '');
    if (tNum && (tNum === colabTel || tNum.endsWith(colabTel) || colabTel.endsWith(tNum))) return true;
    if (tReal && (tReal === colabTel || tReal.endsWith(colabTel) || colabTel.endsWith(tReal))) return true;
    if (colabTel.length >= 8 && tNum.length >= 8 && colabTel.slice(-8) === tNum.slice(-8)) return true;
    if (colabTel.length >= 8 && tReal.length >= 8 && colabTel.slice(-8) === tReal.slice(-8)) return true;

    return false;
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const openTickets = myTickets.filter(t => t.status !== 'concluido' && t.status !== 'cancelado');
  const hasOpenTickets = openTickets.length > 0;

  // Tickets que possuem mensagens de histórico anteriores
  const ticketsWithConversa = myTickets.filter(t => t.conversa && t.conversa.length > 0);
  const totalConversasCount = ticketsWithConversa.reduce((acc, t) => acc + (t.conversa?.length || 0), 0);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Polling de mensagens quando o chat estiver ativo
  useEffect(() => {
    if (!activeChatTicket) return;

    const fetchTicket = async () => {
      try {
        const res = await fetch(`/api/tickets/${activeChatTicket.id}`);
        if (res.ok) {
          const updated = await res.json();
          setActiveChatTicket(prev => {
            if (!prev) return updated;
            if (JSON.stringify(prev.conversa) !== JSON.stringify(updated.conversa) || prev.status !== updated.status) {
              return updated;
            }
            return prev;
          });
        }
      } catch (err) {
        console.error('Erro no polling do chat:', err);
      }
    };

    const interval = setInterval(fetchTicket, 3000);
    return () => clearInterval(interval);
  }, [activeChatTicket?.id]);

  // Auto-scroll chat para a última mensagem
  useEffect(() => {
    if (activeChatTicket) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeChatTicket?.conversa]);

  if (!colaborador) return null;

  const fallbackImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(colaborador.nome)}&background=f3e5ab&color=2c151c&size=400`;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'concluido': return <span className="px-2 py-0.5 bg-green-500/20 text-green-400 border border-green-500/50 rounded-full text-xs font-bold uppercase tracking-wider">Concluído</span>;
      case 'cancelado': return <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 border border-gray-500/50 rounded-full text-xs font-bold uppercase tracking-wider">Cancelado</span>;
      case 'em_atendimento': return <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/50 rounded-full text-xs font-bold uppercase tracking-wider">Em Atend.</span>;
      default: return <span className="px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/50 rounded-full text-xs font-bold uppercase tracking-wider">Aberto</span>;
    }
  };

  const handleStartChat = async () => {
    // 1. Se já existir um chamado em atendimento ou com histórico recente desse colaborador, podemos abrir diretamente!
    const existingActiveTicket = myTickets.find(t => t.status === 'em_atendimento');
    if (existingActiveTicket) {
      try {
        const ticketRes = await fetch(`/api/tickets/${existingActiveTicket.id}`);
        if (ticketRes.ok) {
          const ticketData = await ticketRes.json();
          setActiveChatTicket(ticketData);
          return;
        }
      } catch (e) {}
    }

    // 2. Senão, cria novo ticket direto (que já herda histórico das conversas anteriores no backend)
    setIsStartingChat(true);
    try {
      const res = await fetch('/api/tickets/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: colaborador.nome, telefone: colabTel })
      });
      const data = await res.json();
      if (data.ok && data.ticketId) {
        const ticketRes = await fetch(`/api/tickets/${data.ticketId}`);
        if (ticketRes.ok) {
          const ticketData = await ticketRes.json();
          setActiveChatTicket(ticketData);
        } else {
          setActiveChatTicket({
            id: data.ticketId,
            solicitanteNome: colaborador.nome,
            number: colabTel,
            status: 'em_atendimento',
            conversa: []
          });
        }
      } else {
        alert('Erro ao iniciar chat: ' + (data.error || 'Falha na resposta do servidor'));
      }
    } catch (e) {
      alert('Erro de conexão ao iniciar chat.');
    } finally {
      setIsStartingChat(false);
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!chatMessage.trim() || !activeChatTicket || isSending) return;

    const textToSend = chatMessage.trim();
    setIsSending(true);

    const optimisticMsg = {
      role: 'agent',
      atendente: 'Organograma',
      text: textToSend,
      timestamp: new Date().toISOString()
    };

    setActiveChatTicket(prev => ({
      ...prev,
      conversa: [...(prev.conversa || []), optimisticMsg]
    }));
    setChatMessage('');

    try {
      const res = await fetch(`/api/tickets/${activeChatTicket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          observacao: textToSend,
          atendente: 'Organograma'
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setActiveChatTicket(updated);
      }
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <div 
        className="relative bg-[#111c33] border-2 border-[#3b82f6]/70 rounded-xl shadow-2xl shadow-black/80 flex flex-col md:flex-row w-full max-w-4xl max-h-[95vh] md:max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-300 my-auto"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white z-20 transition-colors p-1.5 rounded-full bg-black/40 hover:bg-black/60 border border-white/10"
          title="Fechar"
        >
          <X size={20} />
        </button>

        {/* Lado Esquerdo: Foto e Informações de Contato / Início de Chat */}
        <div className="w-full md:w-2/5 p-4 sm:p-6 bg-gradient-to-b from-[#1e3a8a] to-[#0f172a] flex flex-col items-center justify-between border-b md:border-b-0 md:border-r border-blue-500/20 shrink-0">
          <div className="flex flex-col items-center w-full">
            <div className="relative w-32 h-40 sm:w-40 sm:h-52 md:w-full md:h-72 border-2 sm:border-3 border-laghetto-gold rounded-lg overflow-hidden shadow-xl shadow-black/60 mb-3 sm:mb-4">
              <img 
                src={colaborador.foto} 
                onError={(e) => { e.target.onerror = null; e.target.src = fallbackImage }}
                alt={colaborador.nome}
                className="w-full h-full object-cover"
              />
              {colaborador.apelido && (
                <div className="absolute bottom-0 w-full bg-laghetto-gold/90 text-laghetto-wine text-center font-bold text-xs py-1">
                  "{colaborador.apelido}"
                </div>
              )}
            </div>

            <div className="text-center w-full mb-2">
              <h3 className="text-white font-bold text-lg leading-tight">{colaborador.nome}</h3>
              <p className="text-laghetto-gold text-xs font-medium mt-0.5">{colaborador.cargo}</p>
            </div>
          </div>
          
          <div className="w-full flex flex-col gap-2 mt-3">
            {/* Botão de Acesso Remoto RustDesk se configurado */}
            {colaborador.rustdesk_id ? (
              <div className="w-full flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => {
                    const cleanId = colaborador.rustdesk_id.replace(/\s+/g, '');
                    window.location.href = `rustdesk://${cleanId}`;
                  }}
                  className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-3 rounded-lg transition-all shadow-lg shadow-blue-900/40 border border-blue-400/50 cursor-pointer text-xs sm:text-sm group"
                  title="Conectar via RustDesk"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="group-hover:scale-110 transition-transform">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                    <line x1="8" y1="21" x2="16" y2="21"></line>
                    <line x1="12" y1="17" x2="12" y2="21"></line>
                  </svg>
                  <span>Acesso Remoto (RustDesk)</span>
                </button>
                <div className="flex items-center justify-between px-2 py-1 bg-black/40 rounded border border-blue-500/30 text-[11px]">
                  <span className="text-gray-400 font-mono">ID: <strong className="text-blue-300">{colaborador.rustdesk_id}</strong></span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(colaborador.rustdesk_id.replace(/\s+/g, ''));
                      alert('ID RustDesk copiado para a área de transferência!');
                    }}
                    className="text-blue-400 hover:text-white underline text-[10px]"
                  >
                    Copiar ID
                  </button>
                </div>
              </div>
            ) : null}

            {colaborador.telefone ? (
              <div className="w-full">
                {activeChatTicket ? (
                  <button
                    onClick={() => setActiveChatTicket(null)}
                    className="flex items-center justify-center gap-2 w-full bg-white/10 hover:bg-white/15 text-gray-200 border border-white/20 py-2.5 px-3 rounded-lg transition-colors font-medium text-xs shadow-md"
                  >
                    <ArrowLeft size={16} />
                    Voltar aos Detalhes
                  </button>
                ) : (
                  <button 
                    onClick={handleStartChat}
                    disabled={isStartingChat}
                    className="flex flex-col items-center justify-center w-full bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/50 py-2.5 px-3 rounded-lg transition-all font-bold shadow-lg disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      {isStartingChat ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                        </svg>
                      )}
                      {isStartingChat ? 'Iniciando Chat...' : 'Conversar pelo Chat'}
                    </div>
                    <div className="text-[10px] text-[#25D366]/70 mt-0.5 font-normal">
                      {totalConversasCount > 0 ? `*Traz ${totalConversasCount} msgs do histórico*` : '*Abre o chat no organograma e pausa o robô*'}
                    </div>
                  </button>
                )}
              </div>
            ) : (
              <div className="text-xs text-gray-500 italic mt-1 text-center">Sem telefone cadastrado</div>
            )}
          </div>
        </div>

        {/* Lado Direito: Se chat ativo, mostra tela de Chat; senão detalhes do colaborador */}
        <div className="w-full md:w-3/5 flex flex-col justify-between overflow-hidden bg-[#0b1120] flex-1 min-h-[380px]">
          {activeChatTicket ? (
            /* ================= PAINEL DE CHAT INLINE ================= */
            <div className="flex flex-col h-[400px] sm:h-[480px] md:h-full">
              {/* Header do Chat */}
              <div className="p-3 sm:p-4 bg-[#15223e] border-b border-blue-500/20 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm sm:text-base">Chat WhatsApp</span>
                    <span className="text-xs font-mono px-2 py-0.5 bg-black/40 rounded border border-laghetto-gold/30 text-laghetto-gold">
                      #{activeChatTicket.id}
                    </span>
                    {getStatusBadge(activeChatTicket.status)}
                  </div>
                  <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Conversando com {colaborador.nome}
                  </p>
                </div>

                {/* Selecionar outro chamado caso queira alternar histórico */}
                {ticketsWithConversa.length > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setActiveChatTicket(null)}
                      title="Ver todos os chamados"
                      className="text-xs text-laghetto-gold hover:underline flex items-center gap-1 bg-black/40 px-2 py-1 rounded border border-laghetto-gold/30"
                    >
                      <History size={12} /> Outros ({ticketsWithConversa.length})
                    </button>
                  </div>
                )}
              </div>

              {/* Corpo de Mensagens */}
              <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-2.5 sm:space-y-3 bg-gradient-to-b from-[#180a0f] to-[#12070b]">
                {/* Mensagem Inicial de Abertura se houver */}
                {activeChatTicket.description && (
                  <div className="flex flex-col items-center my-1.5">
                    <div className="bg-laghetto-gold/10 border border-laghetto-gold/20 text-laghetto-gold text-xs rounded-lg px-3 py-1.5 text-center max-w-[85%]">
                      {activeChatTicket.description}
                    </div>
                  </div>
                )}

                {activeChatTicket.conversa && activeChatTicket.conversa.length > 0 ? (
                  activeChatTicket.conversa.map((msg, idx) => {
                    const isUser = msg.role === 'user';
                    return (
                      <div key={idx} className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}>
                        <div 
                          className={`max-w-[85%] px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl text-xs sm:text-sm leading-relaxed shadow-md ${
                            isUser 
                              ? 'bg-[#1e293b] text-[#f8fafc] border border-blue-500/25 rounded-tl-none' 
                              : 'bg-[#2563eb] text-white font-semibold border border-blue-400/40 rounded-tr-none'
                          }`}
                        >
                          <div className="whitespace-pre-wrap break-words">{msg.text}</div>
                          {msg.attachment && (
                            <div className="mt-1.5 pt-1.5 border-t border-black/10 text-[11px] italic opacity-85">
                              📎 Arquivo anexo: {msg.attachment}
                            </div>
                          )}
                        </div>
                        <span className="text-[9px] sm:text-[10px] text-gray-500 mt-0.5 px-1">
                          {isUser ? (colaborador.nome.split(' ')[0]) : (msg.atendente || 'Você')} • {new Date(msg.timestamp || Date.now()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 py-8">
                    <MessagesSquare size={32} className="text-blue-400/40 mb-2" />
                    <p className="text-xs sm:text-sm font-medium">Nenhuma mensagem registrada neste chamado.</p>
                    <p className="text-[11px] text-gray-500 mt-1">Envie uma mensagem abaixo para falar com {colaborador.nome} via WhatsApp.</p>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Input de Envio de Mensagem */}
              <form onSubmit={handleSendMessage} className="p-2 sm:p-3 bg-[#111c33] border-t border-blue-500/20 flex gap-2 items-center">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={e => setChatMessage(e.target.value)}
                  placeholder={`Responder via WhatsApp...`}
                  className="flex-1 bg-black/40 border border-blue-500/30 rounded-lg px-3 py-2 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
                  disabled={isSending}
                />
                <button
                  type="submit"
                  disabled={!chatMessage.trim() || isSending}
                  className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-3 sm:px-4 py-2 rounded-lg font-bold flex items-center gap-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-md text-xs sm:text-sm"
                >
                  {isSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  <span>Enviar</span>
                </button>
              </form>
            </div>
          ) : (
            /* ================= PAINEL DE DETALHES PADRÃO ================= */
            <div className="p-4 sm:p-6 md:p-8 flex flex-col justify-start overflow-y-auto max-h-[60vh] md:max-h-[85vh]">
              <div className="mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">{colaborador.nome}</h2>
                <p className="text-lg md:text-xl text-laghetto-gold font-medium">{colaborador.cargo}</p>
              </div>

              <div className="space-y-3.5">
                <div className="flex items-center text-gray-300 bg-black/25 p-3 rounded-lg border border-laghetto-gold/15">
                  <Star className="text-laghetto-gold mr-3 shrink-0" size={20} />
                  <div>
                    <p className="text-xs text-gray-400 uppercase">Setor</p>
                    <p className="font-semibold text-white">{colaborador.setor}</p>
                  </div>
                </div>

                <div className="flex items-center text-gray-300 bg-black/25 p-3 rounded-lg border border-laghetto-gold/15">
                  <Mail className="text-laghetto-gold mr-3 shrink-0" size={20} />
                  <div>
                    <p className="text-xs text-gray-400 uppercase">E-mail Corporativo</p>
                    <p className="font-medium text-gray-200">{colaborador.email || '-'}</p>
                  </div>
                </div>

                <div className="flex items-center text-gray-300 bg-black/25 p-3 rounded-lg border border-laghetto-gold/15">
                  <Phone className="text-laghetto-gold mr-3 shrink-0" size={20} />
                  <div>
                    <p className="text-xs text-gray-400 uppercase">WhatsApp Corporativo</p>
                    <p className="font-medium text-gray-200">{colaborador.telefone || 'Não cadastrado'}</p>
                  </div>
                </div>

                {colaborador.rustdesk_id && (
                  <div className="flex items-center justify-between text-gray-300 bg-blue-950/30 p-3 rounded-lg border border-blue-500/30">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-400/40 flex items-center justify-center mr-3 text-blue-300 shrink-0">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                          <line x1="8" y1="21" x2="16" y2="21"></line>
                          <line x1="12" y1="17" x2="12" y2="21"></line>
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-blue-300 font-semibold uppercase">Computador / Acesso Remoto (RustDesk)</p>
                        <p className="font-mono text-sm text-white font-bold">{colaborador.rustdesk_id} {colaborador.rustdesk_alias ? <span className="text-xs font-normal text-blue-200">({colaborador.rustdesk_alias})</span> : ''}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const cleanId = colaborador.rustdesk_id.replace(/\s+/g, '');
                        window.location.href = `rustdesk://${cleanId}`;
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-xs shadow transition-colors flex items-center gap-1"
                    >
                      Conectar
                    </button>
                  </div>
                )}

                {/* Mochila Digital Unificada: Ativos do Inventário + Equipamentos declarados */}
                <div className="flex flex-col gap-2 bg-black/25 p-3 rounded-lg border border-blue-500/20">
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setShowAssets(!showAssets)}
                  >
                    <div className="flex items-center">
                      <div className="w-5 h-5 mr-3 text-blue-400 flex items-center justify-center">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase">Mochila Digital / Equipamentos TI</p>
                        <p className="font-semibold text-blue-300 text-xs sm:text-sm">
                          {totalMochilaCount > 0 ? `${totalMochilaCount} item(ns) atribuído(s)` : 'Nenhum ativo atribuído'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a 
                        href="/inventario.html" 
                        target="_blank" 
                        onClick={e => e.stopPropagation()} 
                        className="text-[11px] font-bold text-blue-400 hover:text-white underline"
                        title="Abrir Inventário Completo"
                      >
                        Ver no Cockpit
                      </a>
                      <span className="text-gray-400">{showAssets ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {showAssets && totalMochilaCount > 0 && (
                    <div className="mt-2 space-y-2 border-t border-white/10 pt-2 animate-in fade-in duration-200">
                      {/* 1. Ativos do Inventário Oficial */}
                      {colabAssets.map(asset => {
                        const isOpti = String(asset.modelo || '').toLowerCase().includes('optiplex') || String(asset.modelo || '').toLowerCase().includes('optiflex');
                        const isNote = String(asset.tipo || asset.modelo || '').toLowerCase().includes('notebook') || String(asset.modelo || '').toLowerCase().includes('vostro') || String(asset.modelo || '').toLowerCase().includes('latitude');
                        const isMonitor = String(asset.tipo || '').toLowerCase().includes('monitor') || String(asset.modelo || '').toLowerCase().includes('se2222') || String(asset.modelo || '').toLowerCase().includes('22mp410');
                        const isKb = String(asset.tipo || '').toLowerCase().includes('teclado') || String(asset.modelo || '').toLowerCase().includes('kb 216') || String(asset.modelo || '').toLowerCase().includes('kb216');
                        const isMouse = String(asset.tipo || '').toLowerCase().includes('mouse') || String(asset.modelo || '').toLowerCase().includes('ms 116') || String(asset.modelo || '').toLowerCase().includes('ms116');
                        const isHeadset = String(asset.tipo || '').toLowerCase().includes('headset') || String(asset.modelo || '').toLowerCase().includes('chs 40');
                        const photoUrl = isOpti ? '/images/modelos/dell_optiplex_3000.png' : isNote ? '/images/modelos/dell_vostro_3510.png' : isMonitor ? '/images/modelos/dell_se2222h.png' : isKb ? '/images/modelos/dell_kb216t.png' : isMouse ? '/images/modelos/dell_ms116.png' : isHeadset ? '/images/modelos/intelbras_chs40.png' : 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=260&auto=format&fit=crop&q=80';

                        return (
                          <div key={asset.id} className="p-2 rounded bg-black/40 border border-blue-500/20 flex items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-9 h-9 rounded-lg bg-white dark:bg-slate-800 p-0.5 border border-white/20 shrink-0 flex items-center justify-center overflow-hidden">
                                <img src={photoUrl} alt={asset.modelo} className="max-w-full max-h-full object-contain" />
                              </div>
                              <div className="truncate">
                                <span className="font-bold text-white block truncate">{asset.modelo || asset.tipo}</span>
                                <span className="text-[10px] text-gray-400 block font-mono truncate">TAG: {asset.serviceTag || '-'} {asset.hostname ? `• ${asset.hostname}` : ''}</span>
                              </div>
                            </div>
                            {asset.hostname && (
                              <button
                                type="button"
                                onClick={() => {
                                  const clean = asset.hostname.replace(/\s+/g, '');
                                  window.location.href = `rustdesk://${clean}`;
                                }}
                                className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold flex items-center gap-1 shadow shrink-0"
                                title="Conectar RustDesk"
                              >
                                Conectar
                              </button>
                            )}
                          </div>
                        );
                      })}

                      {/* 2. Equipamentos vinculados ao colaborador */}
                      {manualEquipments.map((eq, i) => {
                        const mLower = String(eq.modelo || eq.tipo || '').toLowerCase();
                        const isNote = mLower.includes('notebboke') || mLower.includes('notebook') || mLower.includes('laptop') || mLower.includes('dell sn');
                        const isMonitor = mLower.includes('monitor');
                        const isCpu = mLower.includes('cpu') || mLower.includes('desktop') || mLower.includes('computador');
                        const isKb = mLower.includes('teclado');
                        const isMouse = mLower.includes('mouse');
                        const isHeadset = mLower.includes('fone') || mLower.includes('headset');

                        const photoUrl = isCpu ? '/images/modelos/dell_optiplex_3000.png' : isNote ? '/images/modelos/dell_vostro_3510.png' : isMonitor ? '/images/modelos/dell_se2222h.png' : isKb ? '/images/modelos/dell_kb216t.png' : isMouse ? '/images/modelos/dell_ms116.png' : isHeadset ? '/images/modelos/intelbras_chs40.png' : 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=260&auto=format&fit=crop&q=80';

                        return (
                          <div key={'manual-' + i} className="p-2 rounded bg-black/40 border border-blue-500/20 flex items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-9 h-9 rounded-lg bg-white dark:bg-slate-800 p-0.5 border border-white/20 shrink-0 flex items-center justify-center overflow-hidden">
                                <img src={photoUrl} alt={eq.modelo} className="max-w-full max-h-full object-contain" />
                              </div>
                              <div className="truncate">
                                <span className="font-bold text-white block truncate">{eq.modelo}</span>
                                <span className="text-[10px] text-blue-300 block truncate">Equipamento em posse</span>
                              </div>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30 shrink-0 font-medium">
                              Atribuído
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                <div 
                  className={`flex items-center justify-between text-gray-300 bg-black/25 hover:bg-black/40 p-3 rounded-lg border cursor-pointer transition-colors ${hasOpenTickets ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-laghetto-gold/15'}`}
                  onClick={() => setShowTickets(!showTickets)}
                >
                  <div className="flex items-center">
                    <MessagesSquare className={`mr-3 shrink-0 ${hasOpenTickets ? 'text-red-500 animate-pulse' : 'text-laghetto-gold'}`} size={20} />
                    <div>
                      <p className="text-xs text-gray-400 uppercase">Histórico de Chamados TI</p>
                      <p className={`font-medium ${hasOpenTickets ? 'text-red-400' : 'text-gray-300'}`}>
                        {myTickets.length} chamado(s) encontrado(s) {hasOpenTickets && `(${openTickets.length} em aberto)`}
                      </p>
                    </div>
                  </div>
                  <div className="text-laghetto-gold/60">{showTickets ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</div>
                </div>

                {showTickets && myTickets.length > 0 && (
                  <div className="mt-2 flex flex-col gap-3 animate-in slide-in-from-top-2">
                    {myTickets.map(t => {
                      const isExpanded = expandedTicketId === t.id;
                      const hasMessages = t.conversa && t.conversa.length > 0;
                      const bgClass = t.status === 'concluido' || t.status === 'cancelado' ? 'bg-black/35 border-gray-700/60' : 'bg-red-500/10 border-red-500/30';
                      return (
                        <div key={t.id} className={`border rounded-lg overflow-hidden transition-all duration-300 ${bgClass}`}>
                          {/* Cabecalho do Chamado */}
                          <div 
                            className="p-3 flex justify-between items-start cursor-pointer hover:bg-white/5"
                            onClick={() => setExpandedTicketId(isExpanded ? null : t.id)}
                          >
                            <div className="flex-1 pr-2">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-white font-bold">#{t.id}</span>
                                {getStatusBadge(t.status)}
                                {hasMessages && (
                                  <span className="text-[11px] px-1.5 py-0.2 bg-laghetto-gold/20 text-laghetto-gold rounded border border-laghetto-gold/30">
                                    {t.conversa.length} msg(s)
                                  </span>
                                )}
                                <span className="text-xs text-gray-400 ml-auto">{new Date(t.createdAt).toLocaleDateString('pt-BR')}</span>
                              </div>
                              <div className="text-laghetto-gold/80 text-sm font-medium">{t.type}</div>
                              <div className="text-gray-400 text-xs mt-1 line-clamp-2">{t.description}</div>
                            </div>
                            <div className="text-gray-400 mt-1">
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                          </div>
                          
                          {/* Chat / Conversa */}
                          {isExpanded && (
                            <div className="p-3 bg-black/50 border-t border-white/5 max-h-72 overflow-y-auto">
                              {hasMessages ? (
                                <div className="flex flex-col gap-3">
                                  {/* Mensagem Inicial (Descricao) */}
                                  <div className="flex flex-col items-end">
                                    <div className="bg-laghetto-gold/20 text-laghetto-gold border border-laghetto-gold/30 rounded-lg rounded-tr-none px-3 py-2 text-sm max-w-[90%]">
                                      {t.description}
                                    </div>
                                    <span className="text-[10px] text-gray-500 mt-1">Abertura</span>
                                  </div>
                                  
                                  {t.conversa.map((msg, idx) => {
                                    const isUser = msg.role === 'user';
                                    return (
                                      <div key={idx} className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}>
                                        <div className={`rounded-lg px-3 py-2 text-sm max-w-[90%] ${isUser ? 'bg-[#2f1620] text-gray-100 border border-laghetto-gold/20 rounded-tl-none' : 'bg-laghetto-gold text-[#221016] font-medium border border-laghetto-gold/30 rounded-tr-none'}`}>
                                          {msg.text}
                                          {msg.attachment && (
                                            <div className="mt-2 text-xs italic opacity-80">
                                              📎 Anexo: {msg.attachment}
                                            </div>
                                          )}
                                        </div>
                                        <span className="text-[10px] text-gray-500 mt-1">
                                          {isUser ? colaborador.nome.split(' ')[0] : (msg.atendente || 'Suporte')} • {new Date(msg.timestamp).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                      </div>
                                    );
                                  })}

                                  <button
                                    onClick={() => setActiveChatTicket(t)}
                                    className="mt-2 self-center text-xs font-semibold text-laghetto-gold hover:underline flex items-center gap-1.5 bg-black/60 px-3.5 py-1.5 rounded-lg border border-laghetto-gold/40 shadow-sm transition-colors hover:bg-black/80"
                                  >
                                    <MessagesSquare size={14} /> Abrir no Chat Interativo
                                  </button>
                                </div>
                              ) : (
                                <div className="text-center text-sm text-gray-400 py-4">
                                  Nenhuma mensagem gravada neste chamado específico.
                                  <div className="mt-2">
                                    <button
                                      onClick={() => setActiveChatTicket(t)}
                                      className="text-xs text-laghetto-gold hover:underline font-medium"
                                    >
                                      Iniciar conversa neste chamado
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
