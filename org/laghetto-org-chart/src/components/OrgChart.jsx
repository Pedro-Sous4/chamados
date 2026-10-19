import React, { useState, useMemo } from 'react';
import Card from './Card';

const getRank = (cargo = '') => {
  const c = cargo.toLowerCase();
  if (c.includes('diretor') || c.includes('ceo') || c.includes('vp')) return 1;
  if (c.includes('gerente') || c.includes('head') || c.includes('lead')) return 2;
  if (c.includes('coordenador')) return 3;
  if (c.includes('supervisor')) return 4;
  if (c.includes('analista')) return 5;
  if (c.includes('assistente') || c.includes('auxiliar')) return 6;
  if (c.includes('estagiário') || c.includes('estagiario')) return 7;
  return 8;
};

// Coleta todos os nomes de setores recursivamente
const getAllSectorNames = (sectorList = []) => {
  let names = [];
  sectorList.forEach(s => {
    names.push(s.nome);
    if (s.subsetores && s.subsetores.length > 0) {
      names = names.concat(getAllSectorNames(s.subsetores));
    }
  });
  return names;
};

// Verifica se um colaborador possui chamado ativo
const getColabTicketStatus = (colab, tickets = []) => {
  const activeTickets = tickets.filter(t => {
    if (t.status === 'concluido' || t.status === 'cancelado' || t.status === 'arquivado') return false;
    if (t.solicitanteNome && t.solicitanteNome.toLowerCase() === (colab.nome || '').toLowerCase()) return true;
    const colabTel = String(colab.telefone || '').replace(/\D/g, '');
    const tNum = String(t.number || '').replace(/\D/g, '');
    if (!colabTel || !tNum) return false;
    return tNum.endsWith(colabTel) || colabTel.endsWith(tNum);
  });
  const hasAberto = activeTickets.some(t => t.status === 'aberto' || !t.status);
  const hasEmAtendimento = !hasAberto && activeTickets.some(t => t.status === 'em_atendimento' || t.status === 'em_andamento');
  return { hasAberto, hasEmAtendimento, hasAny: hasAberto || hasEmAtendimento };
};

const OrgChart = ({ searchTerm, tickets = [], data, onSelect, isAdmin, onMoveCard, onRenameSector, onDeleteSector }) => {
  const [dragOverSector, setDragOverSector] = useState(null);
  const { lideranca, setores } = data;

  // Estado dos setores expandidos (começa vazio = todos colapsados por padrão)
  const [expandedSectors, setExpandedSectors] = useState({});
  // Estado da liderança (Diego Cáceres / CEO) colapsável
  const [isLiderancaExpanded, setIsLiderancaExpanded] = useState(true);

  const allSectorNames = useMemo(() => getAllSectorNames(setores), [setores]);

  // Animação suave com curva cinematográfica de desaceleração (easeInOutCubic)
  const activeAnimationRef = React.useRef(null);

  const smoothScrollTo = (viewport, targetLeft, targetTop, duration = 850) => {
    if (!viewport) return;
    if (activeAnimationRef.current) cancelAnimationFrame(activeAnimationRef.current);

    const startLeft = viewport.scrollLeft;
    const startTop = viewport.scrollTop;
    const distanceX = targetLeft - startLeft;
    const distanceY = targetTop - startTop;

    if (duration <= 0) {
      viewport.scrollLeft = targetLeft;
      viewport.scrollTop = targetTop;
      return;
    }

    const startTime = performance.now();

    // Curva cúbica suave (começa gradual, acelera sutilmente e desacelera com extrema elegância)
    const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const step = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = easeInOutCubic(progress);

      viewport.scrollLeft = startLeft + distanceX * ease;
      viewport.scrollTop = startTop + distanceY * ease;

      if (progress < 1) {
        activeAnimationRef.current = requestAnimationFrame(step);
      } else {
        activeAnimationRef.current = null;
      }
    };

    activeAnimationRef.current = requestAnimationFrame(step);
  };

  // Centraliza qualquer elemento com precisão milimétrica e transição aveludada
  const centerTarget = (target, duration = 850) => {
    const el = typeof target === 'string' ? document.getElementById(target) : target;
    const viewport = document.getElementById('org-viewport');
    if (!el || !viewport) return;

    const vRect = viewport.getBoundingClientRect();
    const eRect = el.getBoundingClientRect();

    const targetScrollLeft = viewport.scrollLeft + (eRect.left - vRect.left) + (eRect.width / 2) - (vRect.width / 2);
    const targetScrollTop = viewport.scrollTop + (eRect.top - vRect.top) + (eRect.height / 2) - (vRect.height / 2);

    smoothScrollTo(viewport, Math.max(0, targetScrollLeft), Math.max(0, targetScrollTop), duration);
  };

  // Se houver busca ativa, auto-expande setores e centraliza com transição cinematográfica no colaborador
  React.useEffect(() => {
    if (searchTerm && searchTerm.trim().length > 1) {
      const termLower = searchTerm.trim().toLowerCase();
      const matchingSectors = {};
      let firstMatchingColabId = null;

      // 1. Verifica liderança
      const liderMatch = (lideranca || []).find(c => c.nome && c.nome.toLowerCase().includes(termLower));
      if (liderMatch) {
        firstMatchingColabId = liderMatch.id;
        setIsLiderancaExpanded(true);
      }

      // 2. Verifica setores e subsetores
      const checkSector = (s) => {
        let match = false;
        const colabMatch = (s.colaboradores || []).find(c => c.nome && c.nome.toLowerCase().includes(termLower));
        if (colabMatch) {
          match = true;
          if (!firstMatchingColabId) firstMatchingColabId = colabMatch.id;
        }
        if (s.subsetores) {
          s.subsetores.forEach(sub => {
            if (checkSector(sub)) match = true;
          });
        }
        if (match) matchingSectors[s.nome] = true;
        return match;
      };

      (setores || []).forEach(checkSector);

      // Expande setores encontrados
      if (Object.keys(matchingSectors).length > 0) {
        setExpandedSectors(prev => ({ ...prev, ...matchingSectors }));
      }

      // Transição cinematográfica para o colaborador encontrado
      if (firstMatchingColabId) {
        const targetId = `card-${firstMatchingColabId}`;
        // Timeout permite ao React renderizar a expansão do DOM do setor antes de calcular o centro
        const timer1 = setTimeout(() => {
          centerTarget(targetId, 900);
        }, 120);

        const timer2 = setTimeout(() => {
          centerTarget(targetId, 700);
        }, 320);

        return () => {
          clearTimeout(timer1);
          clearTimeout(timer2);
        };
      }
    } else if (searchTerm === '') {
      // Quando apaga a busca, volta suavemente para o topo centralizado na liderança
      resetToHomePosition(850);
    }
  }, [searchTerm, setores, lideranca]);

  // Retorna à posição inicial: topo centralizado na Liderança
  const resetToHomePosition = (duration = 750) => {
    const liderancaEl = document.getElementById('lideranca-node');
    const viewport = document.getElementById('org-viewport');
    if (!viewport) return;

    if (liderancaEl) {
      const vRect = viewport.getBoundingClientRect();
      const lRect = liderancaEl.getBoundingClientRect();
      const targetLeft = viewport.scrollLeft + (lRect.left - vRect.left) + (lRect.width / 2) - (vRect.width / 2);
      smoothScrollTo(viewport, Math.max(0, targetLeft), 0, duration);
    } else {
      // Fallback para o meio da largura total
      const maxScroll = viewport.scrollWidth - viewport.clientWidth;
      if (maxScroll > 0) {
        smoothScrollTo(viewport, maxScroll / 2, 0, duration);
      }
    }
  };

  // Suporte a movimentação com o mouse (Drag-to-Scroll / Pan com a mãozinha)
  const isDraggingViewport = React.useRef(false);
  const dragStartPos = React.useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const hasMovedRef = React.useRef(false);

  React.useEffect(() => {
    const viewport = document.getElementById('org-viewport');
    if (!viewport) return;

    const onMouseDown = (e) => {
      // Ignora clique em botões, inputs, cards e links para não conflitar com cliques comuns
      if (e.target.closest('button, input, select, textarea, .colab-card, a, [role="button"]')) {
        return;
      }
      isDraggingViewport.current = true;
      hasMovedRef.current = false;
      dragStartPos.current = {
        x: e.clientX,
        y: e.clientY,
        scrollLeft: viewport.scrollLeft,
        scrollTop: viewport.scrollTop
      };
      viewport.style.cursor = 'grabbing';
      viewport.style.userSelect = 'none';
    };

    const onMouseMove = (e) => {
      if (!isDraggingViewport.current) return;
      const dx = e.clientX - dragStartPos.current.x;
      const dy = e.clientY - dragStartPos.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        hasMovedRef.current = true;
      }
      viewport.scrollLeft = dragStartPos.current.scrollLeft - dx;
      viewport.scrollTop = dragStartPos.current.scrollTop - dy;
    };

    const onMouseUp = () => {
      if (!isDraggingViewport.current) return;
      isDraggingViewport.current = false;
      viewport.style.cursor = 'grab';
      viewport.style.removeProperty('user-select');
    };

    viewport.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Suporte a Touch Drag no Celular / Mobile
    const onTouchStart = (e) => {
      if (e.target.closest('button, input, select, textarea, .colab-card, a, [role="button"]')) {
        return;
      }
      if (e.touches.length === 1) {
        isDraggingViewport.current = true;
        hasMovedRef.current = false;
        dragStartPos.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          scrollLeft: viewport.scrollLeft,
          scrollTop: viewport.scrollTop
        };
      }
    };

    const onTouchMove = (e) => {
      if (!isDraggingViewport.current || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - dragStartPos.current.x;
      const dy = e.touches[0].clientY - dragStartPos.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        hasMovedRef.current = true;
      }
      viewport.scrollLeft = dragStartPos.current.scrollLeft - dx;
      viewport.scrollTop = dragStartPos.current.scrollTop - dy;
    };

    const onTouchEnd = () => {
      isDraggingViewport.current = false;
    };

    viewport.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      viewport.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      viewport.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  // Garante inicialização centralizada na Liderança ao carregar ou redimensionar a tela
  React.useEffect(() => {
    // Imediato sem animação
    resetToHomePosition(0);

    // Repete após a renderização completa dos nós com requestAnimationFrame
    const frameId = requestAnimationFrame(() => {
      resetToHomePosition(0);
    });

    const t1 = setTimeout(() => resetToHomePosition(0), 100);
    const t2 = setTimeout(() => resetToHomePosition(500), 300);

    const onResize = () => {
      resetToHomePosition(0);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const toggleSector = (sectorName, event) => {
    const isCurrentlyExpanded = !!expandedSectors[sectorName];
    const willBeExpanded = !isCurrentlyExpanded;
    const sectorDomId = 'sector-header-' + sectorName.replace(/\s+/g, '-');

    setExpandedSectors(prev => ({
      ...prev,
      [sectorName]: willBeExpanded
    }));

    if (willBeExpanded) {
      // Ao abrir: transição sedosa e aveludada de 900ms para centralizar o setor
      setTimeout(() => centerTarget(sectorDomId, 900), 60);
    } else {
      // Ao fechar: desliza de volta suavemente para o centro da Liderança em 850ms
      setTimeout(() => resetToHomePosition(850), 60);
    }
  };

  const expandAll = () => {
    const all = {};
    allSectorNames.forEach(n => { all[n] = true; });
    setExpandedSectors(all);
    setIsLiderancaExpanded(true);
  };

  const collapseAll = () => {
    setExpandedSectors({});
    setIsLiderancaExpanded(false);
    setTimeout(() => resetToHomePosition(true), 80);
  };

  const handleDragOver = (e, setorName) => {
    e.preventDefault();
    setDragOverSector(setorName);
  };

  const handleDragLeave = () => {
    setDragOverSector(null);
  };

  const handleDrop = (e, setorName) => {
    e.preventDefault();
    setDragOverSector(null);
    const colabId = e.dataTransfer.getData('colabId');
    if (colabId && onMoveCard) {
      onMoveCard(colabId, setorName);
    }
  };

  const handleBroadcast = (e, s) => {
    e.stopPropagation();
    const msg = window.prompt(`Digite a mensagem para enviar via WhatsApp para todos do setor "${s.nome}":`);
    if (!msg || msg.trim() === '') return;
    
    const getPhones = (sector) => {
      let phones = [];
      if (sector.colaboradores) {
        sector.colaboradores.forEach(c => {
          if (c.telefone) phones.push(c.telefone.replace(/\D/g, ''));
        });
      }
      if (sector.subsetores) {
        sector.subsetores.forEach(sub => {
          phones = phones.concat(getPhones(sub));
        });
      }
      return phones;
    };
    
    const allPhones = getPhones(s);
    if (allPhones.length === 0) {
      alert('Nenhum colaborador com telefone cadastrado neste setor ou subsetores.');
      return;
    }
    
    if (!window.confirm(`Enviar mensagem para ${allPhones.length} colaborador(es)?`)) return;

    fetch('/api/bot/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telefones: allPhones, mensagem: msg })
    }).then(r => r.json()).then(res => {
      if (res.ok) alert('Mensagem disparada para a fila do Bot!');
      else alert('Erro: ' + res.error);
    }).catch(() => alert('Erro de conexão ao enviar.'));
  };

  const SectorNode = ({ s }) => {
    const isExpanded = !!expandedSectors[s.nome];
    const colabs = s.colaboradores || [];
    const totalPessoas = colabs.length;

    // Resumo de chamados no setor
    let abertosCount = 0;
    let emAtendimentoCount = 0;
    colabs.forEach(c => {
      const status = getColabTicketStatus(c, tickets);
      if (status.hasAberto) abertosCount++;
      else if (status.hasEmAtendimento) emAtendimentoCount++;
    });

    const hasAnyActive = abertosCount > 0 || emAtendimentoCount > 0;

    // Sort and group colaboradores
    const sorted = [...colabs].sort((a, b) => getRank(a.cargo) - getRank(b.cargo));
    const grouped = sorted.reduce((acc, c) => {
      const r = getRank(c.cargo);
      if (!acc[r]) acc[r] = [];
      acc[r].push(c);
      return acc;
    }, {});

    return (
      <li>
        <div 
          className={`inline-flex flex-col items-center p-3 rounded-2xl transition-all duration-300 min-w-[220px] ${
            dragOverSector === s.nome ? 'bg-laghetto-gold/15 ring-2 ring-laghetto-gold' : ''
          }`}
          onDragOver={(e) => handleDragOver(e, s.nome)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, s.nome)}
        >
          {/* Header do Setor com Botão de Colapso e Badges */}
          <div 
            id={'sector-header-' + s.nome.replace(/\s+/g, '-')}
            onClick={(e) => toggleSector(s.nome, e)}
            className={`group/sector cursor-pointer select-none px-4 py-2 rounded-2xl border transition-all duration-300 backdrop-blur-md shadow-md flex items-center gap-2.5 ${
              isExpanded 
                ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/20' 
                : 'bg-white dark:bg-[#111c33] hover:bg-blue-50 dark:hover:bg-[#15223e] border-blue-200 dark:border-blue-500/40 text-[#0f172a] dark:text-[#f8fafc]'
            } ${hasAnyActive && !isExpanded ? (abertosCount > 0 ? 'ring-2 ring-red-500 animate-pulse' : 'ring-2 ring-amber-400 animate-pulse') : ''}`}
            title="Clique para expandir ou recolher este setor"
          >
            {/* Ícone Indicador de Expandir / Recolher */}
            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold transition-transform duration-300 ${
              isExpanded ? 'rotate-180 bg-white text-blue-600' : 'rotate-0 bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300'
            }`}>
              ▼
            </span>

            {/* Nome do Setor */}
            <span className="font-bold text-sm tracking-wide whitespace-nowrap">
              {s.nome}
            </span>

            {/* Contador de Pessoas */}
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              isExpanded ? 'bg-blue-700 text-white' : 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
            }`}>
              {totalPessoas}
            </span>

            {/* Alertas de Chamados Piscando no Setor (quando colapsado ou expandido) */}
            {abertosCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse" title={`${abertosCount} chamado(s) em aberto no setor`}>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                {abertosCount} aberto
              </span>
            )}

            {emAtendimentoCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/50 animate-pulse" title={`${emAtendimentoCount} chamado(s) em atendimento no setor`}>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                {emAtendimentoCount} em atend.
              </span>
            )}

            {/* Ações de Admin */}
            {isAdmin && (
              <div className="flex items-center gap-1.5 ml-2 border-l border-white/20 pl-2">
                <button onClick={(e) => { e.stopPropagation(); if (onRenameSector) onRenameSector(s.nome); }} className="hover:text-laghetto-gold transition-colors p-1" title="Renomear Setor">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                </button>
                <button onClick={(e) => { e.stopPropagation(); if (onDeleteSector) onDeleteSector(s.nome); }} className="text-red-400 hover:text-red-300 transition-colors p-1" title="Excluir Setor">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
                <button onClick={(e) => handleBroadcast(e, s)} className="text-blue-400 hover:text-blue-300 transition-colors p-1" title="Aviso via WhatsApp">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 11l18-5v12L3 14v-3z"></path></svg>
                </button>
              </div>
            )}
          </div>
          
          {/* Conteúdo dos Colaboradores (Exibido apenas quando expandido) */}
          {isExpanded && (
            <div className="flex flex-col items-center gap-4 w-full mt-4 pt-2 animate-in fade-in zoom-in-95 duration-200">
              {totalPessoas === 0 ? (
                <div className="text-xs text-gray-400 italic py-2">Nenhum colaborador neste setor</div>
              ) : (
                Object.keys(grouped).sort((a,b)=>a-b).map(rank => (
                  <div key={rank} className="flex justify-center gap-4 flex-wrap">
                    {grouped[rank].map(colab => (
                      <div key={colab.id} className="transition-transform hover:z-50">
                        <Card colaborador={colab} onClick={onSelect} isAdmin={isAdmin} tickets={tickets} />
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Subsetores recursivos */}
        {s.subsetores && s.subsetores.length > 0 && (
          <ul>
            {s.subsetores.map(sub => <SectorNode key={sub.nome} s={sub} />)}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div id="org-tree-content" className="org-tree min-w-max px-[50vw] py-12 flex justify-center select-none cursor-grab pb-48">
      {/* Barra de Controles Rápidos: Expandir / Recolher Todos / Resetar Visão */}
      <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 sm:gap-2 bg-black/85 backdrop-blur-md border border-laghetto-gold/40 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-2xl max-w-[94vw] overflow-x-auto">
        <button 
          onClick={() => resetToHomePosition(750)}
          className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold bg-white/10 text-white hover:bg-white/20 transition-all border border-white/20 flex items-center gap-1 shrink-0 cursor-pointer"
          title="Centralizar no topo"
        >
          <span>⊙</span> Início
        </button>
        <button 
          onClick={expandAll}
          className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold bg-laghetto-gold/20 text-laghetto-gold hover:bg-laghetto-gold hover:text-laghetto-wine transition-all border border-laghetto-gold/40 flex items-center gap-1 shrink-0 cursor-pointer"
        >
          <span>⤢</span> Expandir
        </button>
        <button 
          onClick={collapseAll}
          className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold bg-white/10 text-white hover:bg-white hover:text-laghetto-wine transition-all border border-white/20 flex items-center gap-1 shrink-0 cursor-pointer"
        >
          <span>⤡</span> Recolher
        </button>
      </div>

      <style>{`
        .org-tree ul {
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding-top: 30px;
          position: relative;
        }
        .org-tree li {
          text-align: center;
          list-style-type: none;
          position: relative;
          padding: 30px 10px 0 10px;
        }
        .org-tree li::before, .org-tree li::after {
          content: '';
          position: absolute;
          top: 0;
          right: 50%;
          border-top: 2px solid rgba(59, 130, 246, 0.4);
          width: 50%;
          height: 30px;
        }
        .org-tree li::after {
          right: auto;
          left: 50%;
          border-left: 2px solid rgba(59, 130, 246, 0.4);
        }
        .org-tree li:only-child::after, .org-tree li:only-child::before {
          display: none;
        }
        .org-tree li:only-child {
          padding-top: 0;
        }
        .org-tree li:first-child::before, .org-tree li:last-child::after {
          border: 0 none;
        }
        .org-tree li:last-child::before {
          border-right: 2px solid rgba(59, 130, 246, 0.4);
          border-radius: 0 8px 0 0;
        }
        .org-tree li:first-child::after {
          border-radius: 8px 0 0 0;
        }
        .org-tree ul ul::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          border-left: 2px solid rgba(59, 130, 246, 0.4);
          width: 0;
          height: 30px;
        }

        /* No tema claro, as linhas de conexão ficam visíveis em tom azul executivo */
        html:not(.dark) .org-tree li::before, 
        html:not(.dark) .org-tree li::after,
        html:not(.dark) .org-tree li:last-child::before,
        html:not(.dark) .org-tree ul ul::before {
          border-color: rgba(37, 99, 235, 0.4) !important;
        }
      `}</style>

      <ul>
        <li>
          <div id="lideranca-node" className="inline-flex flex-col items-center">
            {/* Header Liderança Clicável para Colapsar/Expandir */}
            <div 
              onClick={() => setIsLiderancaExpanded(!isLiderancaExpanded)}
              className="group/lider cursor-pointer select-none px-5 py-2.5 rounded-full border transition-all duration-300 backdrop-blur-md shadow-lg flex items-center gap-2.5 bg-white dark:bg-[#111c33] border-blue-300 dark:border-blue-500/40 text-[#1e3a8a] dark:text-[#93c5fd] hover:border-blue-500 mb-6"
              title="Clique para expandir ou recolher a Liderança"
            >
              <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold transition-transform duration-300 ${
                isLiderancaExpanded ? 'rotate-180 bg-blue-600 text-white' : 'rotate-0 bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300'
              }`}>
                ▼
              </span>
              <span className="font-extrabold text-sm tracking-widest uppercase">
                LIDERANÇA
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {lideranca.length}
              </span>
            </div>

            {/* Cards da Liderança - Colapsáveis */}
            {isLiderancaExpanded && (
              <div className="flex justify-center gap-6 flex-wrap bg-white/70 dark:bg-[#111c33]/70 p-6 rounded-2xl border border-blue-200 dark:border-blue-500/20 shadow-md backdrop-blur-sm animate-in fade-in duration-300">
                {lideranca.map(lider => (
                  <Card key={lider.id} colaborador={lider} onClick={onSelect} isCenter={true} isAdmin={isAdmin} tickets={tickets} />
                ))}
              </div>
            )}
          </div>
          {setores && setores.length > 0 && (
            <ul>
              {setores.map(s => <SectorNode key={s.nome} s={s} />)}
            </ul>
          )}
        </li>
      </ul>
    </div>
  );
};

export default OrgChart;