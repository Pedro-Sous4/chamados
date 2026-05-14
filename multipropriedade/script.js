/* ═══════════════════════════════════════════════════════════════
   SISTEMA DE CHAMADOS — MULTIPROPRIEDADE LAGHETTO
   script.js
   ═══════════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────────────
//  CONSTANTES
// ─────────────────────────────────────────────────────────────────

const STORAGE_KEY   = 'chamados_tickets';
const USER_TYPE_KEY = 'chamados_user_type';

const TIPOS_SOLICITACAO = ['Inclusão', 'Edição', 'Distrato'];
const SALAS             = ['PEDRAS ALTAS', 'NOTURNO PEDRAS ALTAS', 'NBA'];
const STATUS_LIST       = ['Aberto', 'Em Atendimento', 'Concluído', 'Cancelado'];

/** Mapeia label → chave de classe CSS para tipos */
const TIPO_CLASS = {
  'Inclusão': 'inclusao',
  'Edição':   'edicao',
  'Distrato': 'distrato',
};

/** Mapeia label → chave de classe CSS para status */
const STATUS_CLASS = {
  'Aberto':          'aberto',
  'Em Atendimento':  'em-atendimento',
  'Concluído':       'concluido',
  'Cancelado':       'cancelado',
};

// ─────────────────────────────────────────────────────────────────
//  ESTADO DA APLICAÇÃO
// ─────────────────────────────────────────────────────────────────

let tickets       = [];   // array de chamados
let userType      = 'Solicitante';
let modalStep     = 1;
let stepOneChoice = null; // tipo selecionado na etapa 1
let currentFile   = null; // { name, type, dataUrl }
let filterStatus  = '';
let filterTipo    = '';
let filterSearch  = '';

// ─────────────────────────────────────────────────────────────────
//  INICIALIZAÇÃO
// ─────────────────────────────────────────────────────────────────

function init() {
  loadFromStorage();
  renderUserType();
  renderTickets();
}

// ─────────────────────────────────────────────────────────────────
//  STORAGE (localStorage)
// ─────────────────────────────────────────────────────────────────

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    tickets = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(tickets)) tickets = [];
  } catch {
    tickets = [];
  }

  const ut = localStorage.getItem(USER_TYPE_KEY);
  userType = ut === 'TI' ? 'TI' : 'Solicitante';
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
}

// ─────────────────────────────────────────────────────────────────
//  TIPO DE USUÁRIO
// ─────────────────────────────────────────────────────────────────

function toggleUserType() {
  userType = userType === 'Solicitante' ? 'TI' : 'Solicitante';
  localStorage.setItem(USER_TYPE_KEY, userType);
  renderUserType();
  renderTickets();
}

function renderUserType() {
  document.getElementById('user-label').textContent = userType;
  document.body.dataset.userType = userType;
}

// ─────────────────────────────────────────────────────────────────
//  MODAL — NOVO CHAMADO
// ─────────────────────────────────────────────────────────────────

function openModal() {
  stepOneChoice = null;
  currentFile   = null;
  resetForm();
  showStep(1);
  document.getElementById('modal-overlay').classList.remove('hidden');
  document.body.classList.add('no-scroll');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  document.body.classList.remove('no-scroll');
}

function showStep(step) {
  modalStep = step;

  // Corpos das etapas
  document.getElementById('step-1').classList.toggle('hidden', step !== 1);
  document.getElementById('step-2').classList.toggle('hidden', step !== 2);

  // Rodapés das etapas
  document.getElementById('footer-1').classList.toggle('hidden', step !== 1);
  document.getElementById('footer-2').classList.toggle('hidden', step !== 2);

  // Atualiza indicador gráfico
  const dot1   = document.getElementById('dot-1');
  const dot2   = document.getElementById('dot-2');
  const line   = document.getElementById('step-line');
  const lbl1   = document.getElementById('label-1');
  const lbl2   = document.getElementById('label-2');

  if (step === 1) {
    dot1.className = 'step-dot current';
    dot2.className = 'step-dot';
    line.classList.remove('done');
    lbl1.className = 'step-label current';
    lbl2.className = 'step-label';
  } else {
    dot1.className = 'step-dot done';
    dot2.className = 'step-dot current';
    line.classList.add('done');
    lbl1.className = 'step-label';
    lbl2.className = 'step-label current';
  }
}

function resetForm() {
  document.getElementById('form-chamado').reset();
  document.querySelectorAll('.tipo-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('file-name-display').textContent = 'Nenhum arquivo selecionado';
  clearError('step1-error');
  clearError('form-error');
}

// ─────────────────────────────────────────────────────────────────
//  ETAPA 1 — SELEÇÃO DO TIPO
// ─────────────────────────────────────────────────────────────────

function selectTipo(tipo) {
  stepOneChoice = tipo;
  document.querySelectorAll('.tipo-card').forEach(card => {
    card.classList.toggle('selected', card.dataset.tipo === tipo);
  });
  clearError('step1-error');
}

function nextStep() {
  if (!stepOneChoice) {
    showError('step1-error', 'Selecione o tipo de solicitação para continuar.');
    return;
  }
  clearError('step1-error');
  showStep(2);
}

function prevStep() {
  clearError('form-error');
  showStep(1);
}

// ─────────────────────────────────────────────────────────────────
//  CPF — MÁSCARA
// ─────────────────────────────────────────────────────────────────

function maskCPF(input) {
  let v = input.value.replace(/\D/g, '').slice(0, 11);
  if (v.length > 9) {
    v = v.replace(/^(\d{3})(\d{3})(\d{3})(\d{0,2})$/, '$1.$2.$3-$4');
  } else if (v.length > 6) {
    v = v.replace(/^(\d{3})(\d{3})(\d{0,3})$/, '$1.$2.$3');
  } else if (v.length > 3) {
    v = v.replace(/^(\d{3})(\d{0,3})$/, '$1.$2');
  }
  input.value = v;
}

function validateCPF(cpf) {
  return /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpf);
}

// ─────────────────────────────────────────────────────────────────
//  UPLOAD DE ARQUIVO
// ─────────────────────────────────────────────────────────────────

function handleFileChange(input) {
  const file    = input.files[0];
  const display = document.getElementById('file-name-display');

  if (!file) {
    display.textContent = 'Nenhum arquivo selecionado';
    currentFile = null;
    return;
  }

  display.textContent = file.name;

  const reader = new FileReader();
  reader.onload = (e) => {
    currentFile = {
      name:    file.name,
      type:    file.type,
      dataUrl: e.target.result,
    };
  };
  reader.readAsDataURL(file);
}

// ─────────────────────────────────────────────────────────────────
//  ENVIO DO CHAMADO
// ─────────────────────────────────────────────────────────────────

function submitChamado() {
  const nome   = document.getElementById('field-nome').value.trim();
  const cpf    = document.getElementById('field-cpf').value.trim();
  const email  = document.getElementById('field-email').value.trim();
  const sala   = document.getElementById('field-sala').value;
  const funcao = document.getElementById('field-funcao').value.trim();

  // Validação dos campos obrigatórios
  const erros = [];
  if (!nome)              erros.push('Nome é obrigatório.');
  if (!cpf)               erros.push('CPF é obrigatório.');
  else if (!validateCPF(cpf)) erros.push('CPF inválido. Use o formato 000.000.000-00.');
  if (!sala)              erros.push('Sala é obrigatória.');
  if (!funcao)            erros.push('Função é obrigatória.');

  if (erros.length) {
    showError('form-error', erros.join(' '));
    return;
  }

  clearError('form-error');

  const ticket = {
    id:               gerarId(),
    tipoSolicitacao:  stepOneChoice,
    nome,
    cpf,
    email:            email || '',
    sala,
    funcao,
    anexo:            currentFile || null,
    status:           'Aberto',
    dataCriacao:      new Date().toISOString(),
  };

  tickets.unshift(ticket); // mais recente primeiro
  saveToStorage();
  closeModal();
  renderTickets();
  showToast('Chamado ' + ticket.id + ' aberto com sucesso!');
}

function gerarId() {
  // Gera identificador curto: C + timestamp base36 + 2 chars aleatórios
  return 'C' + Date.now().toString(36).toUpperCase().slice(-4)
       + Math.random().toString(36).slice(2, 4).toUpperCase();
}

// ─────────────────────────────────────────────────────────────────
//  MENSAGENS DE ERRO
// ─────────────────────────────────────────────────────────────────

function showError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  const textEl = document.getElementById(id + '-text');
  if (textEl) textEl.textContent = msg;
  else el.querySelector('span:last-child').textContent = msg;
  el.classList.remove('hidden');
}

function clearError(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

// ─────────────────────────────────────────────────────────────────
//  LISTAGEM DE CHAMADOS
// ─────────────────────────────────────────────────────────────────

function renderTickets() {
  const list       = document.getElementById('ticket-list');
  const emptyEl    = document.getElementById('empty-state');
  const badge      = document.getElementById('count-badge');
  const subtitle   = document.getElementById('table-subtitle');

  // Filtragem
  const filtered = tickets.filter(t => {
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterTipo   && t.tipoSolicitacao !== filterTipo) return false;
    if (filterSearch) {
      const q = filterSearch.toLowerCase();
      if (
        !t.nome.toLowerCase().includes(q) &&
        !t.sala.toLowerCase().includes(q) &&
        !t.id.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  renderStats();

  badge.textContent = filtered.length + (filtered.length === 1 ? ' chamado' : ' chamados');
  subtitle.textContent = tickets.length === 0
    ? 'Nenhum chamado cadastrado ainda'
    : 'Clique em uma linha para ver detalhes';

  if (filtered.length === 0) {
    list.innerHTML = '';
    emptyEl.classList.remove('hidden');
    return;
  }

  emptyEl.classList.add('hidden');

  // Coluna de ações (apenas TI)
  const acoesCol = userType === 'TI'
    ? `<td class="col-acoes" onclick="event.stopPropagation()">
         <select class="status-select" onchange="changeStatus('{ID}', this.value)">
           ${STATUS_LIST.map(s => `<option value="${s}" {SEL_${s}}>${s}</option>`).join('')}
         </select>
       </td>`
    : '';

  list.innerHTML = filtered.map(ticket => {
    const tipoClass   = TIPO_CLASS[ticket.tipoSolicitacao] || 'inclusao';
    const statusClass = STATUS_CLASS[ticket.status]        || 'aberto';

    let acoes = acoesCol.replace('{ID}', ticket.id);
    STATUS_LIST.forEach(s => {
      acoes = acoes.replace(`{SEL_${s}}`, s === ticket.status ? 'selected' : '');
    });

    return `
      <tr class="ticket-row" onclick="openDetail('${ticket.id}')">
        <td class="td-id"><span class="id-badge">${ticket.id}</span></td>
        <td class="td-nome">
          <span class="nome-text">${escHtml(ticket.nome)}</span>
          <span class="funcao-text">${escHtml(ticket.funcao)}</span>
        </td>
        <td>
          <span class="tipo-badge badge-${tipoClass}">${escHtml(ticket.tipoSolicitacao)}</span>
        </td>
        <td class="td-sala">${escHtml(ticket.sala)}</td>
        <td>
          <span class="status-badge badge-${statusClass}">${escHtml(ticket.status)}</span>
        </td>
        <td class="td-data">${formatDate(ticket.dataCriacao)}</td>
        ${acoes}
      </tr>
    `;
  }).join('');
}

// ─────────────────────────────────────────────────────────────────
//  ESTATÍSTICAS
// ─────────────────────────────────────────────────────────────────

function renderStats() {
  document.getElementById('stat-total').textContent      = tickets.length;
  document.getElementById('stat-abertos').textContent    = tickets.filter(t => t.status === 'Aberto').length;
  document.getElementById('stat-atendimento').textContent = tickets.filter(t => t.status === 'Em Atendimento').length;
  document.getElementById('stat-concluidos').textContent = tickets.filter(t => t.status === 'Concluído').length;
}

// ─────────────────────────────────────────────────────────────────
//  ALTERAÇÃO DE STATUS (TI)
// ─────────────────────────────────────────────────────────────────

function changeStatus(id, newStatus) {
  const ticket = tickets.find(t => t.id === id);
  if (!ticket) return;
  ticket.status = newStatus;
  saveToStorage();
  renderTickets();
}

function changeStatusFromDetail(id, newStatus) {
  changeStatus(id, newStatus);
  openDetail(id); // re-renderiza o modal de detalhe
}

// ─────────────────────────────────────────────────────────────────
//  MODAL DE DETALHE
// ─────────────────────────────────────────────────────────────────

function openDetail(id) {
  const ticket = tickets.find(t => t.id === id);
  if (!ticket) return;

  const tipoClass   = TIPO_CLASS[ticket.tipoSolicitacao] || 'inclusao';
  const statusClass = STATUS_CLASS[ticket.status]        || 'aberto';

  // Subtítulo do cabeçalho do modal
  document.getElementById('detail-id-subtitle').textContent = 'ID: ' + ticket.id;

  // Seção de alteração de status (somente TI)
  const tiSection = userType === 'TI' ? `
    <div class="detail-footer">
      <div class="detail-label">Alterar status</div>
      <div class="status-actions">
        ${STATUS_LIST.map(s => `
          <button
            class="status-btn${s === ticket.status ? ' active' : ''}"
            onclick="changeStatusFromDetail('${ticket.id}', '${s}')"
          >${s}</button>
        `).join('')}
      </div>
    </div>
  ` : '';

  document.getElementById('detail-content').innerHTML = `
    <div class="detail-top">
      <span class="detail-id">${ticket.id}</span>
      <span class="status-badge badge-${statusClass}">${escHtml(ticket.status)}</span>
    </div>

    <div class="detail-grid">

      <div class="detail-item">
        <span class="detail-label">Tipo de solicitação</span>
        <span class="detail-value">
          <span class="tipo-badge badge-${tipoClass}">${escHtml(ticket.tipoSolicitacao)}</span>
        </span>
      </div>

      <div class="detail-item">
        <span class="detail-label">Data de criação</span>
        <span class="detail-value">${formatDateFull(ticket.dataCriacao)}</span>
      </div>

      <div class="detail-item">
        <span class="detail-label">Nome</span>
        <span class="detail-value">${escHtml(ticket.nome)}</span>
      </div>

      <div class="detail-item">
        <span class="detail-label">CPF</span>
        <span class="detail-value mono">${escHtml(ticket.cpf)}</span>
      </div>

      <div class="detail-item">
        <span class="detail-label">Email</span>
        <span class="detail-value">
          ${ticket.email ? escHtml(ticket.email) : '<em>Não informado</em>'}
        </span>
      </div>

      <div class="detail-item">
        <span class="detail-label">Sala</span>
        <span class="detail-value">${escHtml(ticket.sala)}</span>
      </div>

      <div class="detail-item full-width">
        <span class="detail-label">Função</span>
        <span class="detail-value">${escHtml(ticket.funcao)}</span>
      </div>

      <div class="detail-item full-width">
        <span class="detail-label">Anexo</span>
        <span class="detail-value">${renderAnexo(ticket.anexo)}</span>
      </div>

    </div>

    ${tiSection}
  `;

  document.getElementById('detail-overlay').classList.remove('hidden');
  document.body.classList.add('no-scroll');
}

function closeDetail() {
  document.getElementById('detail-overlay').classList.add('hidden');
  document.body.classList.remove('no-scroll');
}

function renderAnexo(anexo) {
  if (!anexo) return '<em>Nenhum anexo</em>';
  if (anexo.type && anexo.type.startsWith('image/')) {
    return `
      <div class="anexo-preview">
        <img src="${anexo.dataUrl}" alt="${escHtml(anexo.name)}" />
        <span>${escHtml(anexo.name)}</span>
      </div>
    `;
  }
  return `<a href="${anexo.dataUrl}" download="${escHtml(anexo.name)}" class="download-link">📎 ${escHtml(anexo.name)}</a>`;
}

// ─────────────────────────────────────────────────────────────────
//  FILTROS
// ─────────────────────────────────────────────────────────────────

function handleSearch(value) {
  filterSearch = value.trim();
  renderTickets();
}

function handleFilterStatus(value) {
  filterStatus = value;
  renderTickets();
}

function handleFilterTipo(value) {
  filterTipo = value;
  renderTickets();
}

// ─────────────────────────────────────────────────────────────────
//  TOAST
// ─────────────────────────────────────────────────────────────────

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3200);
}

// ─────────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────────

/** Escapa caracteres HTML para evitar XSS */
function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
    });
  } catch { return ''; }
}

function formatDateFull(iso) {
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      dateStyle: 'short', timeStyle: 'short',
    });
  } catch { return ''; }
}

// ─────────────────────────────────────────────────────────────────
//  FECHAR OVERLAYS AO CLICAR FORA
// ─────────────────────────────────────────────────────────────────

document.getElementById('modal-overlay').addEventListener('click', function (e) {
  if (e.target === this) closeModal();
});

document.getElementById('detail-overlay').addEventListener('click', function (e) {
  if (e.target === this) closeDetail();
});

// ─────────────────────────────────────────────────────────────────
//  START
// ─────────────────────────────────────────────────────────────────

init();
