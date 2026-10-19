const fs = require('fs');

const modalCode = `import React, { useEffect, useState } from 'react';
import { X, Mail, Phone, Hash, Star, MessagesSquare, ChevronDown, ChevronUp } from 'lucide-react';

const Modal = ({ colaborador, onClose, tickets = [] }) => {
  const [showTickets, setShowTickets] = useState(false);
  const [expandedTicketId, setExpandedTicketId] = useState(null);
  
  const colabTel = String(colaborador.telefone || '').replace(/\\D/g, '');
  
  const myTickets = tickets.filter(t => {
    if (t.solicitanteNome && t.solicitanteNome.toLowerCase() === (colaborador.nome || '').toLowerCase()) return true;
    if (!colabTel) return false;
    const tNum = String(t.number || '').replace(/\\D/g, '');
    return tNum.endsWith(colabTel) || colabTel.endsWith(tNum);
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Most recent first

  const openTickets = myTickets.filter(t => t.status !== 'concluido' && t.status !== 'cancelado');
  const hasOpenTickets = openTickets.length > 0;

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!colaborador) return null;

  const fallbackImage = \`https://ui-avatars.com/api/?name=\${encodeURIComponent(colaborador.nome)}&background=f3e5ab&color=2c151c&size=400\`;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'concluido': return <span className="px-2 py-0.5 bg-green-500/20 text-green-400 border border-green-500/50 rounded-full text-xs font-bold uppercase tracking-wider">Concluído</span>;
      case 'cancelado': return <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 border border-gray-500/50 rounded-full text-xs font-bold uppercase tracking-wider">Cancelado</span>;
      case 'em_atendimento': return <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/50 rounded-full text-xs font-bold uppercase tracking-wider">Em Atend.</span>;
      default: return <span className="px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/50 rounded-full text-xs font-bold uppercase tracking-wider">Aberto</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="relative bg-laghetto-wine border-2 border-laghetto-gold rounded-xl shadow-2xl shadow-laghetto-gold/20 flex flex-col md:flex-row w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-300"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-laghetto-gold/70 hover:text-laghetto-gold z-10 transition-colors"
        >
          <X size={24} />
        </button>

        <div className="w-full md:w-2/5 p-6 bg-gradient-to-b from-laghetto-wine to-black flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-laghetto-gold/30">
          <div className="relative w-48 h-64 md:w-full md:h-80 border-4 border-laghetto-gold rounded-lg overflow-hidden shadow-lg shadow-black/50">
            <img 
              src={colaborador.foto} 
              onError={(e) => { e.target.onerror = null; e.target.src = fallbackImage }}
              alt={colaborador.nome}
              className="w-full h-full object-cover"
            />
            {colaborador.apelido && (
              <div className="absolute bottom-0 w-full bg-laghetto-gold/90 text-laghetto-wine text-center font-bold text-sm py-1">
                "{colaborador.apelido}"
              </div>
            )}
          </div>
          
          {colaborador.telefone && (
            <a href={\`https://wa.me/\${colabTel}\`} target="_blank" rel="noreferrer" className="mt-4 flex items-center justify-center gap-2 w-full bg-[#25D366]/20 hover:bg-[#25D366]/40 text-[#25D366] border border-[#25D366]/50 py-3 rounded-lg transition-colors font-bold shadow-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
              Chamar no WhatsApp
            </a>
          )}
        </div>

        <div className="w-full md:w-3/5 p-8 flex flex-col justify-start overflow-y-auto max-h-[85vh]">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-white mb-1">{colaborador.nome}</h2>
            <p className="text-xl text-laghetto-gold font-medium">{colaborador.cargo}</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center text-gray-300 bg-black/20 p-3 rounded-lg border border-laghetto-gold/10">
              <Star className="text-laghetto-gold mr-3" size={20} />
              <div>
                <p className="text-xs text-gray-400 uppercase">Setor</p>
                <p className="font-semibold text-white">{colaborador.setor}</p>
              </div>
            </div>

            <div className="flex items-center text-gray-300 bg-black/20 p-3 rounded-lg border border-laghetto-gold/10">
              <Mail className="text-laghetto-gold mr-3" size={20} />
              <div>
                <p className="text-xs text-gray-400 uppercase">E-mail Corporativo</p>
                <p className="font-medium">{colaborador.email || '-'}</p>
              </div>
            </div>

            <div className="flex items-center text-gray-300 bg-black/20 p-3 rounded-lg border border-laghetto-gold/10">
              <Phone className="text-laghetto-gold mr-3" size={20} />
              <div>
                <p className="text-xs text-gray-400 uppercase">WhatsApp Corporativo</p>
                <p className="font-medium">{colaborador.telefone || 'Nǜo cadastrado'}</p>
              </div>
            </div>
            
            <div 
              className={\`flex items-center justify-between text-gray-300 bg-black/20 hover:bg-black/40 p-3 rounded-lg border cursor-pointer transition-colors \${hasOpenTickets ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-laghetto-gold/10'}\`}
              onClick={() => setShowTickets(!showTickets)}
            >
              <div className="flex items-center">
                <MessagesSquare className={\`mr-3 \${hasOpenTickets ? 'text-red-500 animate-pulse' : 'text-laghetto-gold'}\`} size={20} />
                <div>
                  <p className="text-xs text-gray-400 uppercase">Histórico de Chamados TI</p>
                  <p className={\`font-medium \${hasOpenTickets ? 'text-red-400' : 'text-gray-300'}\`}>
                    {myTickets.length} chamado(s) enc. {hasOpenTickets && \`(\${openTickets.length} em aberto)\`}
                  </p>
                </div>
              </div>
              <div className="text-laghetto-gold/50">{showTickets ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</div>
            </div>

            {showTickets && myTickets.length > 0 && (
              <div className="mt-2 flex flex-col gap-3 animate-in slide-in-from-top-2">
                {myTickets.map(t => {
                  const isExpanded = expandedTicketId === t.id;
                  const bgClass = t.status === 'concluido' || t.status === 'cancelado' ? 'bg-black/30 border-gray-700' : 'bg-red-500/10 border-red-500/30';
                  return (
                    <div key={t.id} className={\`border rounded-lg overflow-hidden transition-all duration-300 \${bgClass}\`}>
                      {/* Cabecalho do Chamado */}
                      <div 
                        className="p-3 flex justify-between items-start cursor-pointer hover:bg-white/5"
                        onClick={() => setExpandedTicketId(isExpanded ? null : t.id)}
                      >
                        <div className="flex-1 pr-2">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-bold">#{t.id}</span>
                            {getStatusBadge(t.status)}
                            <span className="text-xs text-gray-400 ml-auto">{new Date(t.createdAt).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <div className="text-laghetto-gold/80 text-sm font-medium">{t.type}</div>
                          <div className="text-gray-400 text-xs mt-1 line-clamp-2">{t.description}</div>
                        </div>
                        <div className="text-gray-500 mt-1">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </div>
                      
                      {/* Chat / Conversa */}
                      {isExpanded && (
                        <div className="p-3 bg-black/50 border-t border-white/5 max-h-60 overflow-y-auto">
                          {t.conversa && t.conversa.length > 0 ? (
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
                                  <div key={idx} className={\`flex flex-col \${isUser ? 'items-end' : 'items-start'}\`}>
                                    <div className={\`rounded-lg px-3 py-2 text-sm max-w-[90%] \${isUser ? 'bg-laghetto-gold/20 text-laghetto-gold border border-laghetto-gold/30 rounded-tr-none' : 'bg-gray-800 text-white border border-gray-700 rounded-tl-none'}\`}>
                                      {msg.text}
                                      {msg.attachment && (
                                        <div className="mt-2 text-xs italic opacity-70">
                                          📎 Anexo enviado
                                        </div>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-gray-500 mt-1">
                                      {isUser ? 'Usuário' : (msg.atendente || 'Suporte')} • {new Date(msg.timestamp).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-center text-sm text-gray-500 py-4">Nenhuma interação registrada ainda.</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            
            {colaborador.equipamentos && (
              <div className="mt-4 p-4 border border-laghetto-gold/30 rounded-lg bg-black/40">
                <h3 className="text-laghetto-gold text-sm uppercase font-bold mb-3">Equipamentos em Posse</h3>
                <div className="text-white text-sm flex flex-col gap-1">
                  {typeof colaborador.equipamentos === 'object' ? (
                    <div className="grid grid-cols-2 gap-2">
                      {colaborador.equipamentos.notebook && <div className="flex items-center gap-2"><span className="text-laghetto-gold">✓</span> Notebook</div>}
                      {colaborador.equipamentos.monitor > 0 && <div className="flex items-center gap-2"><span className="text-laghetto-gold">✓</span> Monitor ({colaborador.equipamentos.monitor}x)</div>}
                      {colaborador.equipamentos.mouse && <div className="flex items-center gap-2"><span className="text-laghetto-gold">✓</span> Mouse</div>}
                      {colaborador.equipamentos.teclado && <div className="flex items-center gap-2"><span className="text-laghetto-gold">✓</span> Teclado</div>}
                      {colaborador.equipamentos.fone && <div className="flex items-center gap-2"><span className="text-laghetto-gold">✓</span> Fone</div>}
                      {colaborador.equipamentos.cpu && <div className="flex items-center gap-2"><span className="text-laghetto-gold">✓</span> CPU</div>}
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{colaborador.equipamentos}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
`;

fs.writeFileSync('c:/chamados/org/laghetto-org-chart/src/components/Modal.jsx', modalCode, 'utf-8');
console.log('Modal.jsx with Chat UI rewritten.');
