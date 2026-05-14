/**
 * tour.js — Tutorial guiado da Central de Chamados (Laghetto)
 *
 * Motor de tour 100% vanilla JS, sem dependências externas.
 * Injeta seus próprios estilos e elementos no DOM sem modificar o HTML existente.
 *
 * Melhorias v2:
 *  - Tooltip maior (480px), fontes maiores, padding generoso
 *  - Footer em duas linhas — botões NUNCA transbordam do tooltip
 *  - Totalmente responsivo: em mobile o tooltip fica fixo na parte inferior
 *  - Repositicionamento automático no resize da janela
 *  - Checkbox "Não mostrar novamente" no último step com explicação
 *  - Finalizar: salva no localStorage apenas se o checkbox estiver marcado
 */

(function () {
  'use strict';

  // ── Constantes ─────────────────────────────────────────────────────────────
  var STORAGE_KEY   = 'laghetto_tour_v1_visto';
  var BRAND_COLOR   = '#925616';
  var OVERLAY_COLOR = 'rgba(0, 0, 0, 0.72)';
  var TOOLTIP_W     = 480;   // largura do tooltip em px (desktop)
  var TOOLTIP_GAP   = 16;    // espaço entre spotlight e tooltip
  var MOBILE_BP     = 600;   // breakpoint mobile em px

  // ── Helpers assíncronos ────────────────────────────────────────────────────

  function wait(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  /**
   * Aguarda um elemento CSS aparecer no DOM por até `timeout` ms.
   * Usa MutationObserver — sem polling, sem bloquear a thread.
   */
  function waitForEl(selector, timeout) {
    timeout = timeout || 5000;
    return new Promise(function (resolve, reject) {
      var el = document.querySelector(selector);
      if (el) { resolve(el); return; }

      var obs = new MutationObserver(function () {
        el = document.querySelector(selector);
        if (el) { obs.disconnect(); clearTimeout(timer); resolve(el); }
      });
      obs.observe(document.body, { childList: true, subtree: true, attributes: true });

      var timer = setTimeout(function () {
        obs.disconnect();
        reject(new Error('[Tour] Elemento não encontrado após ' + timeout + 'ms: ' + selector));
      }, timeout);
    });
  }

  /** Define valor de input de forma compatível com React e listeners nativos */
  function setVal(el, value) {
    try {
      var nativeSetter =
        Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,  'value') ||
        Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,'value');
      if (nativeSetter && nativeSetter.set) {
        nativeSetter.set.call(el, value);
      } else {
        el.value = value;
      }
    } catch (_) { el.value = value; }
    el.dispatchEvent(new Event('input',  { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /** "Digita" texto caractere a caractere com efeito visual */
  async function typeInto(el, text) {
    el.focus();
    setVal(el, '');
    for (var i = 0; i < text.length; i++) {
      el.value += text[i];
      el.dispatchEvent(new Event('input', { bubbles: true }));
      await wait(28);
    }
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /** Preenche o formulário de novo chamado com dados de demonstração */
  async function fillDemoForm() {
    var fields = [
      { id: 'm-nome',   value: 'Tutorial Demo'       },
      { id: 'm-cpf',    value: '000.000.000-00'       },
      { id: 'm-email',  value: 'demo@laghetto.com.br' },
      { id: 'm-funcao', value: 'Demonstração'         },
    ];
    for (var i = 0; i < fields.length; i++) {
      var el = document.getElementById(fields[i].id);
      if (el) await typeInto(el, fields[i].value);
    }
    var sel = document.getElementById('m-sala');
    if (sel && sel.options.length > 1) {
      sel.value = sel.options[1].value;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  /** Fecha o modal de novo chamado se estiver aberto */
  function closeModalIfOpen() {
    var modal    = document.getElementById('modal-chamado');
    var btnClose = document.getElementById('modal-close');
    if (modal && !modal.classList.contains('hidden') && btnClose) {
      btnClose.click();
    }
  }

  // ── Definição dos passos ───────────────────────────────────────────────────
  var STEPS = [
    // ─── 0 · Boas-vindas ─────────────────────────────────────────────────────
    {
      target:    null,
      placement: 'center',
      title:     '👋 Bem-vindo à Central de Chamados!',
      content:
        'Olá! Este tutorial vai te apresentar as principais funcionalidades do sistema ' +
        'em poucos passos simples.<br><br>' +
        'Use os botões abaixo para navegar, ou clique em <strong>"Pular tutorial"</strong> ' +
        'se preferir explorar por conta própria.',
    },

    // ─── 1 · Lista de chamados ────────────────────────────────────────────────
    {
      target:    '#tour-table-card',
      placement: 'top',
      title:     '📋 Lista de Chamados',
      content:
        'Aqui ficam todos os chamados registrados no sistema.<br><br>' +
        'Cada linha exibe o <strong>solicitante</strong>, o <strong>tipo de operação</strong>, ' +
        'uma prévia da <strong>descrição</strong>, o <strong>status</strong> atual e a ' +
        '<strong>data</strong> de abertura.<br><br>' +
        'Clique em qualquer linha para ver todos os detalhes do chamado.',
    },

    // ─── 2 · Botão Novo Chamado ────────────────────────────────────────────────
    {
      target:    '#btn-novo-chamado',
      placement: 'bottom',
      title:     '➕ Novo Chamado',
      content:
        'Use este botão para abrir um novo chamado.<br><br>' +
        'Ao clicar, um formulário de duas etapas será exibido: primeiro você escolhe o ' +
        '<strong>tipo de operação</strong> e depois preenche as <strong>informações do usuário</strong>.<br><br>' +
        'Vamos abrir o formulário para você ver como funciona!',
      beforeNext: async function () {
        document.getElementById('btn-novo-chamado').click();
        await wait(500);
      },
    },

    // ─── 3 · Tipos (Inclusão, Edição, Distrato) ───────────────────────────────
    {
      target:    '#modal-step-1',
      placement: 'right',
      title:     '📂 Tipo de Chamado',
      content:
        'Selecione o tipo de operação desejada:<br><br>' +
        '• <strong>Inclusão</strong> — adicionar um novo registro ao sistema<br>' +
        '• <strong>Edição</strong> — alterar dados de um registro já existente<br>' +
        '• <strong>Distrato</strong> — cancelar ou rescindir um contrato<br><br>' +
        'Vamos selecionar <em>"Inclusão"</em> como exemplo e avançar para o preenchimento.',
      beforeNext: async function () {
        var card = document.querySelector('.tipo-card[data-tipo="INCLUSÃO"]');
        if (card) { card.click(); await wait(450); }
      },
    },

    // ─── 4 · Preenchimento das informações ────────────────────────────────────
    {
      target:    '#modal-step-2',
      placement: 'left',
      title:     '📝 Informações do Usuário',
      content:
        'Preencha os dados da pessoa a ser incluída:<br><br>' +
        '• <strong>Nome</strong> e <strong>CPF</strong> são obrigatórios<br>' +
        '• <strong>E-mail</strong> é opcional (usado para envio de notificação)<br>' +
        '• <strong>Sala</strong> e <strong>Função</strong> identificam o local de trabalho<br>' +
        '• <strong>Anexo</strong> — você pode incluir um arquivo se necessário<br><br>' +
        'Preenchemos os campos com dados de demonstração para você visualizar.',
      beforeShow: async function () {
        await wait(200);
        await fillDemoForm();
        await wait(150);
      },
    },

    // ─── 5 · Toggle WhatsApp ──────────────────────────────────────────────────
    {
      target:    '#tour-wpp-toggle',
      placement: 'bottom',
      title:     '📱 Notificação via WhatsApp',
      content:
        'Ative este toggle se quiser que o solicitante receba <strong>notificações pelo WhatsApp</strong> ' +
        'quando o status do chamado for atualizado pela equipe.<br><br>' +
        'Ao ativar, um campo será exibido para você informar o número do WhatsApp ' +
        '(com <strong>DDI + DDD</strong>). Exemplo: <code>5551999990000</code>.',
    },

    // ─── 6 · Barra de pesquisa ────────────────────────────────────────────────
    {
      target:    '#q',
      placement: 'bottom',
      title:     '🔍 Barra de Pesquisa',
      content:
        'Use a barra de pesquisa para encontrar chamados rapidamente.<br><br>' +
        'Você pode buscar por <strong>nome do solicitante</strong>, <strong>número</strong> ' +
        'ou qualquer trecho da <strong>descrição</strong>.<br><br>' +
        'A busca é executada automaticamente enquanto você digita — ' +
        'sem precisar pressionar Enter.',
      beforeShow: async function () {
        closeModalIfOpen();
        await wait(350);
      },
    },

    // ─── 7 · Filtro por status ────────────────────────────────────────────────
    {
      target:    '#filter-status',
      placement: 'bottom',
      title:     '🏷️ Filtrar por Status',
      content:
        'Use este seletor para filtrar os chamados por status:<br><br>' +
        '• <span style="color:#be123c;font-weight:700">Aberto</span> — aguardando atendimento<br>' +
        '• <span style="color:#92400e;font-weight:700">Em atendimento</span> — sendo tratado pela equipe<br>' +
        '• <span style="color:#15803d;font-weight:700">Concluído</span> — problema resolvido<br>' +
        '• <span style="font-weight:700">Cancelado</span> — encerrado sem resolução<br><br>' +
        'Os filtros de pesquisa e status podem ser usados juntos.',
    },

    // ─── 8 · Abrir o chamado ──────────────────────────────────────────────────
    {
      target:    '#btn-novo-chamado',
      placement: 'bottom',
      title:     '🚀 Abrir o Chamado',
      content:
        'Depois de preencher todas as informações, clique em <strong>"Abrir chamado"</strong> ' +
        'no formulário para registrar o chamado no sistema.<br><br>' +
        'O chamado aparecerá na lista com status <strong>Aberto</strong> ' +
        'e a equipe responsável será notificada.<br><br>' +
        'Ao clicar em <strong>"Próximo"</strong>, um chamado de demonstração será criado ' +
        'para você ver o resultado final!',
      beforeNext: async function () {
        document.getElementById('btn-novo-chamado').click();
        await wait(500);
        var card = document.querySelector('.tipo-card[data-tipo="INCLUSÃO"]');
        if (card) { card.click(); await wait(450); }
        await fillDemoForm();
        await wait(400);
        var btn = document.getElementById('modal-submit');
        if (btn) { btn.click(); await wait(2800); }
      },
    },

    // ─── 9 · Agradecimento + checkbox "não mostrar novamente" ─────────────────
    {
      target:    null,
      placement: 'center',
      title:     '🎉 Tudo pronto!',
      content:
        'Você concluiu o tutorial da Central de Chamados!<br><br>' +
        'Um <strong>chamado de demonstração</strong> foi criado e já aparece na lista.<br><br>' +
        'Caso queira rever este tutorial, clique no botão ' +
        '<strong>"Tutorial"</strong> no cabeçalho da página a qualquer momento. Bom trabalho! 🙌' +

        // Caixa "não mostrar novamente"
        '<div id="tour-no-repeat-wrap" style="' +
          'display:flex;align-items:flex-start;gap:11px;cursor:pointer;' +
          'margin-top:20px;padding:15px 17px;' +
          'background:#fdf8f0;border:1.5px solid #e8d5b0;border-radius:11px;' +
        '" onclick="(function(){var c=document.getElementById(\'tour-no-repeat\');if(c)c.checked=!c.checked;})()">' +
          '<input type="checkbox" id="tour-no-repeat" checked ' +
            'onclick="event.stopPropagation()" ' +
            'style="width:17px;height:17px;margin-top:3px;flex-shrink:0;' +
                   'accent-color:#925616;cursor:pointer;" />' +
          '<div>' +
            '<p style="margin:0;font-size:14.5px;font-weight:700;color:#925616;line-height:1.4;">' +
              'Não mostrar este tutorial ao entrar novamente' +
            '</p>' +
            '<p style="margin:5px 0 0;font-size:13px;color:#a07848;line-height:1.55;">' +
              'Com esta opção marcada, o tutorial <strong>não aparecerá automaticamente</strong> ' +
              'na próxima vez que você fizer login.<br>' +
              'Você ainda pode acessá-lo a qualquer momento clicando em ' +
              '<strong>"Tutorial"</strong> no cabeçalho.' +
            '</p>' +
          '</div>' +
        '</div>',
    },
  ];

  // ── CSS injetado dinamicamente ─────────────────────────────────────────────
  var CSS =

    /* spotlight ─────────────────────────────────────────────────────────── */
    '#tour-spotlight{' +
      'position:fixed;z-index:9998;pointer-events:none;border-radius:10px;' +
      'box-shadow:0 0 0 9999px ' + OVERLAY_COLOR + ';' +
      'transition:' +
        'top .32s cubic-bezier(.4,0,.2,1),' +
        'left .32s cubic-bezier(.4,0,.2,1),' +
        'width .32s cubic-bezier(.4,0,.2,1),' +
        'height .32s cubic-bezier(.4,0,.2,1),' +
        'border-radius .32s;' +
    '}' +

    /* tooltip container ─────────────────────────────────────────────────── */
    '#tour-tooltip{' +
      'position:fixed;z-index:10000;' +
      'background:#fff;border-radius:18px;' +
      'box-shadow:0 14px 54px rgba(0,0,0,.22),0 3px 14px rgba(0,0,0,.10);' +
      'padding:30px 32px 24px;' +
      'width:' + TOOLTIP_W + 'px;max-width:calc(100vw - 28px);' +
      'box-sizing:border-box;' +
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;' +
    '}' +

    /* título ────────────────────────────────────────────────────────────── */
    '#tour-tooltip-title{' +
      'font-size:19px;font-weight:800;color:#1a1a1a;' +
      'margin:0 0 13px;line-height:1.35;' +
    '}' +

    /* corpo ─────────────────────────────────────────────────────────────── */
    '#tour-tooltip-body{' +
      'font-size:15.5px;color:#4a4a4a;line-height:1.74;margin:0;' +
    '}' +
    '#tour-tooltip-body code{' +
      'background:#f5f5f5;padding:2px 6px;border-radius:5px;' +
      'font-family:monospace;font-size:13.5px;color:#c0392b;' +
    '}' +

    /* ── footer: duas linhas ──────────────────────────────────────────────
       Linha 1: pontos de progresso (esq) │ "Pular tutorial" (dir)
       Linha 2:         ← Anterior (esq) │    Próximo → (dir)
    ────────────────────────────────────────────────────────────────────── */
    '#tour-footer{' +
      'display:flex;flex-direction:column;gap:13px;' +
      'border-top:1.5px solid #f0f0f0;padding-top:18px;margin-top:16px;' +
    '}' +
    '#tour-footer-row1{' +
      'display:flex;align-items:center;justify-content:space-between;gap:10px;' +
    '}' +
    '#tour-footer-row2{' +
      'display:flex;align-items:center;justify-content:space-between;gap:10px;' +
    '}' +

    /* pontos de progresso ───────────────────────────────────────────────── */
    '.tour-dots{display:flex;gap:6px;align-items:center;}' +
    '.tour-dot{' +
      'width:7px;height:7px;border-radius:50%;background:#e8d5b0;' +
      'transition:background .2s,transform .2s;flex-shrink:0;' +
    '}' +
    '.tour-dot.active{background:' + BRAND_COLOR + ';transform:scale(1.45);}' +

    /* botão pular ───────────────────────────────────────────────────────── */
    '#tour-btn-skip{' +
      'background:none;border:none;color:#b0a090;font-size:13.5px;' +
      'font-weight:500;cursor:pointer;padding:0;line-height:1;' +
      'transition:color .15s;white-space:nowrap;' +
    '}' +
    '#tour-btn-skip:hover{color:#888;}' +

    /* botão anterior ────────────────────────────────────────────────────── */
    '#tour-btn-prev{' +
      'background:none;border:1.5px solid #e0d0c0;color:' + BRAND_COLOR + ';' +
      'font-size:14.5px;font-weight:600;cursor:pointer;' +
      'padding:10px 20px;border-radius:10px;line-height:1.4;' +
      'transition:border-color .15s,background .15s;white-space:nowrap;' +
    '}' +
    '#tour-btn-prev:hover{border-color:' + BRAND_COLOR + ';background:#fdf8f0;}' +

    /* botão próximo / finalizar ─────────────────────────────────────────── */
    '#tour-btn-next{' +
      'background:' + BRAND_COLOR + ';border:none;color:#fff;' +
      'font-size:14.5px;font-weight:700;cursor:pointer;' +
      'padding:11px 24px;border-radius:10px;line-height:1.4;' +
      'transition:opacity .15s;white-space:nowrap;' +
    '}' +
    '#tour-btn-next:hover:not(:disabled){opacity:.88;}' +
    '#tour-btn-next:disabled{opacity:.5;cursor:not-allowed;}' +

    /* ── Responsivo: mobile (largura < 600px) ─────────────────────────────
       Tooltip fica colado na base da tela em largura total
    ────────────────────────────────────────────────────────────────────── */
    '@media (max-width:599px){' +
      '#tour-tooltip{' +
        'position:fixed!important;' +
        'bottom:0!important;top:auto!important;' +
        'left:0!important;right:0!important;' +
        'width:100%!important;max-width:100%!important;' +
        'border-radius:20px 20px 0 0!important;' +
        'padding:22px 20px 28px!important;' +
        'transform:none!important;' +
        'max-height:78vh;overflow-y:auto;' +
      '}' +
      '#tour-tooltip-title{font-size:17px;}' +
      '#tour-tooltip-body{font-size:14.5px;}' +
      '#tour-btn-prev,#tour-btn-next{padding:11px 18px;font-size:14px;}' +
    '}' +

    /* botão "Tutorial" no header ────────────────────────────────────────── */
    '#tour-replay-btn{' +
      'display:inline-flex;align-items:center;gap:6px;' +
      'padding:8px 15px;border-radius:10px;' +
      'border:1px solid rgba(255,255,255,.25);' +
      'background:rgba(255,255,255,.10);' +
      'color:rgba(255,255,255,.85);' +
      'font-size:13px;font-weight:600;cursor:pointer;' +
      'line-height:1.4;transition:all .15s;font-family:inherit;' +
    '}' +
    '#tour-replay-btn:hover{background:rgba(255,255,255,.22);color:#fff;}';

  // ── Estado do tour ─────────────────────────────────────────────────────────
  var state = {
    running:      false,
    currentIndex: 0,
    spotlight:    null,
    tooltip:      null,
    resizeTimer:  null,
  };

  // ── Injeção de estilos ─────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('tour-styles')) return;
    var style = document.createElement('style');
    style.id = 'tour-styles';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  // ── Construção dos elementos DOM ───────────────────────────────────────────
  function buildDOM() {
    if (document.getElementById('tour-spotlight')) return;

    // Spotlight
    var sp = document.createElement('div');
    sp.id = 'tour-spotlight';
    sp.style.display = 'none';
    document.body.appendChild(sp);
    state.spotlight = sp;

    // Tooltip — footer em 2 linhas para nunca transbordar
    var tt = document.createElement('div');
    tt.id = 'tour-tooltip';
    tt.style.display = 'none';
    tt.innerHTML =
      '<p id="tour-tooltip-title"></p>' +
      '<div id="tour-tooltip-body"></div>' +
      '<div id="tour-footer">' +
        '<div id="tour-footer-row1">' +
          '<div class="tour-dots" id="tour-dots"></div>' +
          '<button id="tour-btn-skip">Pular tutorial</button>' +
        '</div>' +
        '<div id="tour-footer-row2">' +
          '<button id="tour-btn-prev">&#8592; Anterior</button>' +
          '<button id="tour-btn-next">Pr&#243;ximo &#8594;</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(tt);
    state.tooltip = tt;

    document.getElementById('tour-btn-next').addEventListener('click', onNext);
    document.getElementById('tour-btn-prev').addEventListener('click', onPrev);
    document.getElementById('tour-btn-skip').addEventListener('click', function () { endTour(false); });

    // ESC encerra
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && state.running) endTour(false);
    });

    // Reposiciona ao redimensionar a janela (debounced)
    window.addEventListener('resize', function () {
      if (!state.running) return;
      clearTimeout(state.resizeTimer);
      state.resizeTimer = setTimeout(repositionCurrent, 140);
    });
  }

  // ── Reposicionamento rápido (sem re-executar ações) ────────────────────────
  function repositionCurrent() {
    if (!state.running) return;
    var step = STEPS[state.currentIndex];

    if (!step.target || step.placement === 'center') {
      applyCenter();
      return;
    }

    var el = document.querySelector(step.target);
    if (!el) return;

    var rect = el.getBoundingClientRect();
    var PAD  = 9;

    state.spotlight.style.width  = (rect.width  + PAD * 2) + 'px';
    state.spotlight.style.height = (rect.height + PAD * 2) + 'px';
    state.spotlight.style.top    = (rect.top    - PAD) + 'px';
    state.spotlight.style.left   = (rect.left   - PAD) + 'px';

    // Mobile: CSS fixa na base — não recalcula top/left do tooltip
    if (window.innerWidth >= MOBILE_BP) {
      positionTooltip(rect, step.placement);
    }
  }

  // ── Renderização de um step ────────────────────────────────────────────────
  async function showStep(index) {
    if (!state.running) return;

    var step = STEPS[index];
    state.currentIndex = index;

    if (typeof step.beforeShow === 'function') {
      await step.beforeShow();
    }
    if (!state.running) return;

    var isCenter = (!step.target || step.placement === 'center');
    var isFirst  = index === 0;
    var isLast   = index === STEPS.length - 1;

    // ─── Pontos de progresso ──────────────────────────────────────────────
    var dotsEl = document.getElementById('tour-dots');
    if (dotsEl) {
      dotsEl.innerHTML = '';
      for (var d = 0; d < STEPS.length; d++) {
        var dot = document.createElement('div');
        dot.className = 'tour-dot' + (d === index ? ' active' : '');
        dotsEl.appendChild(dot);
      }
    }

    // ─── Conteúdo ─────────────────────────────────────────────────────────
    document.getElementById('tour-tooltip-title').textContent = step.title;
    document.getElementById('tour-tooltip-body').innerHTML    = step.content;

    var btnPrev = document.getElementById('tour-btn-prev');
    var btnNext = document.getElementById('tour-btn-next');
    var row2    = document.getElementById('tour-footer-row2');

    btnPrev.style.display     = isFirst ? 'none' : '';
    // Se não há botão "anterior", alinha o "próximo" à direita
    row2.style.justifyContent = isFirst ? 'flex-end' : 'space-between';
    btnNext.textContent       = isLast  ? 'Finalizar \u2713' : 'Pr\u00f3ximo \u2192';
    btnNext.disabled          = false;

    // ─── Posicionamento ───────────────────────────────────────────────────
    if (isCenter) {
      applyCenter();
      return;
    }

    var el;
    try {
      el = await waitForEl(step.target, 4000);
    } catch (err) {
      console.warn(err.message + ' — Avançando para o próximo step.');
      if (index + 1 < STEPS.length) await showStep(index + 1);
      return;
    }

    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await wait(320);

    var rect = el.getBoundingClientRect();
    var PAD  = 9;

    state.spotlight.style.display      = 'block';
    state.spotlight.style.width        = (rect.width  + PAD * 2) + 'px';
    state.spotlight.style.height       = (rect.height + PAD * 2) + 'px';
    state.spotlight.style.top          = (rect.top    - PAD) + 'px';
    state.spotlight.style.left         = (rect.left   - PAD) + 'px';
    state.spotlight.style.borderRadius = '10px';
    state.spotlight.style.transform    = '';
    state.spotlight.style.boxShadow    = '0 0 0 9999px ' + OVERLAY_COLOR;

    state.tooltip.style.display = 'block';

    if (window.innerWidth >= MOBILE_BP) {
      state.tooltip.style.transform = '';
      positionTooltip(rect, step.placement);
    }
  }

  /** Posicionamento centralizado (steps sem target ou placement:'center') */
  function applyCenter() {
    state.spotlight.style.display      = 'block';
    state.spotlight.style.width        = '0px';
    state.spotlight.style.height       = '0px';
    state.spotlight.style.top          = '50vh';
    state.spotlight.style.left         = '50vw';
    state.spotlight.style.borderRadius = '50%';
    state.spotlight.style.boxShadow    = '0 0 0 9999px ' + OVERLAY_COLOR;

    state.tooltip.style.display = 'block';

    if (window.innerWidth < MOBILE_BP) {
      // CSS cuida do posicionamento em mobile — limpa estilos inline
      state.tooltip.style.top       = '';
      state.tooltip.style.left      = '';
      state.tooltip.style.transform = '';
    } else {
      state.tooltip.style.top       = '50%';
      state.tooltip.style.left      = '50%';
      state.tooltip.style.transform = 'translate(-50%, -50%)';
    }
  }

  /**
   * Calcula a posição do tooltip em relação ao elemento destacado.
   * Usa a altura real do tooltip para evitar cortes na viewport.
   * Chamado apenas em desktop (>= MOBILE_BP).
   *
   * Regra especial: quando o alvo está na zona do header/toolbar (topo < 25% da
   * viewport) e o placement é 'bottom', o tooltip seria posicionado sobre a
   * tabela, cobrindo o conteúdo principal. Nesses casos o tooltip é ancorado
   * no canto inferior-direito da tela, mantendo a tabela totalmente visível.
   */
  function positionTooltip(rect, placement) {
    var vw  = window.innerWidth;
    var vh  = window.innerHeight;
    var PAD = 9;
    var ttH = state.tooltip.offsetHeight || 340;
    var top, left;

    // Elemento no topo da tela (header / toolbar sticky) + placement 'bottom'
    // → redireciona para o canto inferior-direito da viewport
    if (placement === 'bottom' && rect.bottom < vh * 0.25) {
      top  = Math.min(vh * 0.55, vh - ttH - 20);
      top  = Math.max(top, vh * 0.35);
      left = Math.max(16, vw - TOOLTIP_W - 20);
      state.tooltip.style.top  = top  + 'px';
      state.tooltip.style.left = left + 'px';
      return;
    }

    switch (placement) {
      case 'bottom':
        top  = rect.bottom + PAD + TOOLTIP_GAP;
        left = rect.left + rect.width / 2 - TOOLTIP_W / 2;
        break;
      case 'top':
        top  = rect.top - PAD - TOOLTIP_GAP - ttH;
        left = rect.left + rect.width / 2 - TOOLTIP_W / 2;
        break;
      case 'left':
        top  = rect.top + rect.height / 2 - ttH / 2;
        left = rect.left - PAD - TOOLTIP_GAP - TOOLTIP_W;
        break;
      case 'right':
        top  = rect.top + rect.height / 2 - ttH / 2;
        left = rect.right + PAD + TOOLTIP_GAP;
        break;
      default:
        top  = rect.bottom + PAD + TOOLTIP_GAP;
        left = rect.left + rect.width / 2 - TOOLTIP_W / 2;
    }

    // Mantém dentro da viewport com margem de 16px
    left = Math.max(16, Math.min(left, vw - TOOLTIP_W - 16));
    top  = Math.max(16, Math.min(top,  vh - ttH - 16));

    state.tooltip.style.top  = top  + 'px';
    state.tooltip.style.left = left + 'px';
  }

  // ── Handlers de navegação ──────────────────────────────────────────────────

  async function onNext() {
    var step    = STEPS[state.currentIndex];
    var isLast  = (state.currentIndex === STEPS.length - 1);
    var btnNext = document.getElementById('tour-btn-next');

    btnNext.disabled = true;

    // No último step, lê se o usuário quer suprimir o tutorial futuro
    var persist = true;
    if (isLast) {
      var cb = document.getElementById('tour-no-repeat');
      persist = cb ? cb.checked : true;
    }

    if (typeof step.beforeNext === 'function') {
      try { await step.beforeNext(); } catch (err) {
        console.warn('[Tour] Erro em beforeNext step ' + state.currentIndex + ':', err);
      }
    }

    if (state.currentIndex + 1 >= STEPS.length) {
      endTour(persist);
    } else {
      await showStep(state.currentIndex + 1);
    }
  }

  function onPrev() {
    if (state.currentIndex > 0) showStep(state.currentIndex - 1);
  }

  // ── Início e fim do tour ──────────────────────────────────────────────────

  function startTour() {
    if (state.running) return;
    state.running      = true;
    state.currentIndex = 0;
    closeModalIfOpen();
    state.spotlight.style.display = 'none';
    state.tooltip.style.display   = 'none';
    showStep(0);
  }

  function endTour(saveSeen) {
    state.running = false;
    if (state.spotlight) state.spotlight.style.display = 'none';
    if (state.tooltip)   state.tooltip.style.display   = 'none';
    closeModalIfOpen();
    if (saveSeen) {
      try { localStorage.setItem(STORAGE_KEY, '1'); } catch (_) {}
    }
  }

  // ── Botão "Tutorial" no header ─────────────────────────────────────────────

  function injectReplayButton() {
    if (document.getElementById('tour-replay-btn')) return;

    var actionsWrap = document.querySelector('header .flex.items-center.gap-3.flex-wrap');
    if (!actionsWrap) return;

    var btn = document.createElement('button');
    btn.id   = 'tour-replay-btn';
    btn.type = 'button';
    btn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"' +
          ' fill="none" stroke="currentColor" stroke-width="2.5"' +
          ' stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>' +
      '</svg> Tutorial';

    btn.addEventListener('click', function () {
      try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
      startTour();
    });

    var divider = actionsWrap.querySelector('.w-px');
    if (divider && divider.nextSibling) {
      actionsWrap.insertBefore(btn, divider);
    } else {
      actionsWrap.insertBefore(btn, actionsWrap.firstChild);
    }
  }

  // ── Marca elementos sem ID para uso como alvos de steps ───────────────────

  function tagElements() {
    var tableCard = document.querySelector('main > div.rounded-2xl');
    if (tableCard && !tableCard.id) tableCard.id = 'tour-table-card';

    var wppLabel = document.querySelector('label[for="m-notif-wpp"]');
    if (wppLabel && !wppLabel.id) wppLabel.id = 'tour-wpp-toggle';
  }

  // ── Inicialização ──────────────────────────────────────────────────────────

  function init() {
    // Só funciona na página principal
    if (!document.getElementById('btn-novo-chamado')) return;

    injectStyles();
    buildDOM();
    tagElements();
    injectReplayButton();

    // Observa o DOM para taguear o label do WhatsApp quando o modal abrir
    var observer = new MutationObserver(function () {
      var wppLabel = document.querySelector('label[for="m-notif-wpp"]');
      if (wppLabel && !wppLabel.id) wppLabel.id = 'tour-wpp-toggle';
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Inicia automaticamente na primeira visita após login
    var alreadySeen = localStorage.getItem(STORAGE_KEY);
    var hasToken    = localStorage.getItem('auth_token');

    if (!alreadySeen && hasToken) {
      setTimeout(startTour, 900);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
