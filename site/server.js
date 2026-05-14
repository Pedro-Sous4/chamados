const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// ── Configuração de e-mail ────────────────────────────────────────────────────
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_USER = process.env.SMTP_USER || 'ti3@laghettomultipropriedade.com.br';
const SMTP_PASS = process.env.SMTP_PASS || 'sthamhoashmjlcsg';

const mailer = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: false,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
  tls: { rejectUnauthorized: false },
});

async function sendConclusaoEmail({ toEmail, solicitanteNome, atendenteNome, ticketId, ticketTipo }) {
  const nome = solicitanteNome || 'solicitante';
  const hora = new Date().getHours();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
  const text =
    `${saudacao}.\n\nPrezado(a) ${nome},\n\nConfirmo que sua solicitação foi atendida.\n\nAtenciosamente,\n${atendenteNome}`;
  const html =
    `<p>${saudacao}.</p>` +
    `<p>Prezado(a) <strong>${nome}</strong>,</p>` +
    `<p>Confirmo que sua solicitação foi atendida.</p>` +
    `<br><p>Atenciosamente,<br><strong>${atendenteNome}</strong></p>`;
  try {
    await mailer.sendMail({
      from: `"Central de Chamados Laghetto" <${SMTP_USER}>`,
      to: toEmail,
      subject: `Chamado #${ticketId} — ${ticketTipo} concluído`,
      text,
      html,
    });
    console.log(`[email] Notificação de conclusão enviada para ${toEmail}`);
    return { ok: true };
  } catch (err) {
    console.warn(`[email] Falha ao enviar para ${toEmail}:`, err.message);
    return { ok: false, error: err.message };
  }
}

// ── Utilitário de escrita em coleção (espelho simplificado do storage do bot) ─
function insertCollection(collection, record) {
  const filePath = path.join(DADOS_DIR, `${collection}.json`);
  if (!fs.existsSync(DADOS_DIR)) fs.mkdirSync(DADOS_DIR, { recursive: true });
  let records = [];
  if (fs.existsSync(filePath)) {
    try { records = JSON.parse(fs.readFileSync(filePath, 'utf-8')); } catch {}
  }
  const saved = { id: Date.now(), createdAt: new Date().toISOString(), ...record };
  records.push(saved);
  fs.writeFileSync(filePath, JSON.stringify(records, null, 2), 'utf-8');
  return saved;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

const AUTH_SALT = 'laghetto-salt-2026-chamados';

function hashPassword(password) {
  return crypto.scryptSync(String(password), AUTH_SALT, 64).toString('hex');
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Sessões persistidas em arquivo para sobreviver reinicializações
const SESSIONS_FILE = path.resolve(__dirname, '..', 'dados', 'sessions.json');

function loadSessions() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const raw = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf-8'));
      const map = new Map(Object.entries(raw));
      // Remove expiradas ao carregar
      const now = Date.now();
      for (const [k, v] of map) { if (now > v.expiresAt) map.delete(k); }
      return map;
    }
  } catch {}
  return new Map();
}

function saveSessions(map) {
  try {
    const dir = path.dirname(SESSIONS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(Object.fromEntries(map)), 'utf-8');
  } catch {}
}

const sessions = loadSessions();

function getSession(req) {
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) { sessions.delete(token); saveSessions(sessions); return null; }
  return session;
}

function requireAuth(req, res) {
  const session = getSession(req);
  if (!session) { sendJson(res, 401, { error: 'Não autenticado' }); return null; }
  // Hidrata role a partir de logins.json para sessões antigas (sem role salvo)
  if (!session.role) {
    const logins = readCollection('logins');
    const user = logins.find(u => u.email.toLowerCase() === session.email.toLowerCase());
    session.role = (user && user.role) ? user.role : 'usuario';
  }
  return session;
}

// Cria logins.json com usuário padrão se não existir
function initLogins() {
  const loginsPath = path.join(DADOS_DIR, 'logins.json');
  if (!fs.existsSync(loginsPath)) {
    if (!fs.existsSync(DADOS_DIR)) fs.mkdirSync(DADOS_DIR, { recursive: true });
    const defaultLogins = [{
      id: Date.now(),
      email: 'ti3@laghettomultipropriedade.com.br',
      password: hashPassword('L@ghetto2026*'),
      createdAt: new Date().toISOString(),
    }];
    fs.writeFileSync(loginsPath, JSON.stringify(defaultLogins, null, 2), 'utf-8');
    console.log('[auth] logins.json criado com usuário padrão.');
  }
  // Garante que salas.json existe e é um array válido
  const salasPath = path.join(DADOS_DIR, 'salas.json');
  if (!fs.existsSync(salasPath) || fs.readFileSync(salasPath, 'utf-8').trim() === '') {
    fs.writeFileSync(salasPath, '[]', 'utf-8');
  }
  // Garante que contatos.json existe
  const contatosPath = path.join(DADOS_DIR, 'contatos.json');
  if (!fs.existsSync(contatosPath) || fs.readFileSync(contatosPath, 'utf-8').trim() === '') {
    fs.writeFileSync(contatosPath, '[]', 'utf-8');
  }
  // Garante que config.json existe
  const configPath = path.join(DADOS_DIR, 'config.json');
  if (!fs.existsSync(configPath) || fs.readFileSync(configPath, 'utf-8').trim() === '') {
    fs.writeFileSync(configPath, JSON.stringify({ whatsapp: { numero: '' } }, null, 2), 'utf-8');
  }
}

const PORT = process.env.SITE_PORT || 9081;

// Pasta de dados compartilhada (workspace chamados/dados/)
const DADOS_DIR = path.resolve(__dirname, '..', 'dados');

// Pasta de arquivos estáticos
const PUBLIC_DIR = path.resolve(__dirname, 'public');

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Lê todos os registros de uma coleção JSON.
 * @param {string} collection
 * @returns {Array<object>}
 */
function readCollection(collection) {
  const filePath = path.join(DADOS_DIR, `${collection}.json`);
  if (!fs.existsSync(filePath)) return [];
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return [];
  }
}

function sendJson(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(body);
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.ico': 'image/x-icon',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
  };

  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
  fs.createReadStream(filePath).pipe(res);
}

// ── Roteador ─────────────────────────────────────────────────────────────────

const ROUTES = {
  /**
   * GET /api/tickets
   * Query params: status, type, q (busca livre em name/description/number)
   */
  'GET /api/stats': (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const start = url.searchParams.get('start');
    const end = url.searchParams.get('end');

    let tickets = readCollection('tickets');

    // Filtro por Data (createdAt: YYYY-MM-DD...)
    console.log(`[STATS] Filtro: start=${start}, end=${end} | Total na base: ${tickets.length}`);
    
    if (start || end) {
      tickets = tickets.filter(t => {
        if (!t.createdAt) return false;
        const d = t.createdAt.split('T')[0]; // Ex: 2026-05-14
        
        const isAfterStart = !start || d >= start;
        const isBeforeEnd = !end || d <= end;
        
        return isAfterStart && isBeforeEnd;
      });
    }
    console.log(`[STATS] Após filtro: ${tickets.length}`);

    const stats = {
      total: tickets.length,
      status: { aberto: 0, concluido: 0, em_atendimento: 0, cancelado: 0 },
      porSetor: {},
      porTipo: {},
      porSolicitante: {},
      porOrigem: { bot: 0, site: 0 },
      palavrasChave: {}
    };

    const stopWords = ['o', 'a', 'de', 'do', 'da', 'em', 'um', 'uma', 'e', 'com', 'no', 'na', 'para', 'com', 'que', 'os', 'as'];

    tickets.forEach(t => {
      // Status
      const s = t.status || 'aberto';
      if (stats.status[s] !== undefined) stats.status[s]++;

      // Origem
      const ori = t.origem === 'site' ? 'site' : 'bot';
      stats.porOrigem[ori]++;

      // Setor (Sala) - Pega apenas o sub-setor final se for Administrativo
      const salaStr = t.sala || 'Não Informado';
      let salaBase = salaStr;
      if (salaStr.includes('Administrativo')) {
        const matches = salaStr.match(/\(([^)]+)\)$/);
        if (matches && matches[1]) {
          salaBase = matches[1];
        }
      }
      stats.porSetor[salaBase] = (stats.porSetor[salaBase] || 0) + 1;

      // Tipo de Problema
      const tipo = t.type || 'Suporte';
      stats.porTipo[tipo] = (stats.porTipo[tipo] || 0) + 1;

      // Solicitante
      const sol = t.solicitante || t.name || 'Anônimo';
      stats.porSolicitante[sol] = (stats.porSolicitante[sol] || 0) + 1;

      // Palavras-Chave (Análise de descrição)
      const words = (t.description || '').toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 2 && !stopWords.includes(w));
      
      words.forEach(w => {
        stats.palavrasChave[w] = (stats.palavrasChave[w] || 0) + 1;
      });
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(stats));
  },

  'GET /api/tickets': (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const filterStatus = url.searchParams.get('status') || '';
    const filterType   = url.searchParams.get('type')   || '';
    const filterQ      = (url.searchParams.get('q') || '').toLowerCase();
    const filterOrigin = url.searchParams.get('origem') || '';
    const start        = url.searchParams.get('start');
    const end          = url.searchParams.get('end');

    let tickets = readCollection('tickets');

    // Filtro por Data
    if (start || end) {
      tickets = tickets.filter(t => {
        if (!t.createdAt) return false;
        const d = t.createdAt.split('T')[0];
        const isAfterStart = !start || d >= start;
        const isBeforeEnd = !end || d <= end;
        return isAfterStart && isBeforeEnd;
      });
    }

    if (filterOrigin === 'site') tickets = tickets.filter(t => t.origem === 'site');
    else if (filterOrigin === 'bot') tickets = tickets.filter(t => t.origem !== 'site');
    if (filterStatus) {
      tickets = tickets.filter(t => t.status === filterStatus);
    } else {
      // Por padrão, esconde os arquivados
      tickets = tickets.filter(t => t.status !== 'arquivado');
    }
    if (filterType)   tickets = tickets.filter(t => t.type   === filterType);
    if (filterQ) {
      tickets = tickets.filter(t =>
        (t.name        || '').toLowerCase().includes(filterQ) ||
        (t.number      || '').toLowerCase().includes(filterQ) ||
        (t.description || '').toLowerCase().includes(filterQ)
      );
    }

    // Enriquece tickets com nome/email do solicitante a partir de logins
    const logins = readCollection('logins');
    const contatos = readCollection('contatos');
    tickets = tickets.map(t => {
      if (t.solicitanteNome && t.solicitanteEmail) return t;
      // Tenta casar pelo email completo ou pelo prefixo (campo solicitante legado)
      let match = logins.find(u =>
        (t.solicitanteEmail && u.email.toLowerCase() === t.solicitanteEmail.toLowerCase()) ||
        (t.solicitante && u.email.toLowerCase().startsWith(t.solicitante.toLowerCase() + '@'))
      );
      // Para tickets de bot: tenta via contato vinculado (id_login)
      if (!match && t.number) {
        const contato = contatos.find(c => c.numero === t.number);
        if (contato && contato.id_login) {
          match = logins.find(u => String(u.id) === String(contato.id_login));
        }
      }
      if (!match) return t;
      return Object.assign({}, t, {
        solicitanteNome:  match.name  || t.solicitanteNome  || t.solicitante || '',
        solicitanteEmail: match.email || t.solicitanteEmail || '',
      });
    });

    sendJson(res, 200, { total: tickets.length, tickets });
  },

  /**
   * POST /api/tickets
   * Body JSON: { name, number, type, description }
   */
  'POST /api/tickets': (req, res) => {
    const session = getSession(req);

    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      let data;
      try { data = JSON.parse(body); } catch {
        return sendJson(res, 400, { error: 'JSON inválido' });
      }

      const { name, number, type, description, notifWpp, solicitante, origem } = data;
      if (!name || !number || !type || !description) {
        return sendJson(res, 422, { error: 'Campos obrigatórios: name, number, type, description' });
      }

      const record = {
        name: String(name).slice(0, 120),
        number: String(number).replace(/\D/g, '').slice(0, 20),
        type: String(type).slice(0, 60),
        description: String(description).slice(0, 1000),
        status: 'aberto',
        origem: origem ? String(origem).slice(0, 20) : 'site',
      };
      if (notifWpp) record.notifWpp = String(notifWpp).replace(/\D/g, '').slice(0, 20);

      // Pega o e-mail da sessão (mais confiável) ou do body
      const rawEmail = (session && session.email) ? session.email : (solicitante || '');
      if (rawEmail) {
        record.solicitante = String(rawEmail).split('@')[0].slice(0, 120);
        record.solicitanteEmail = String(rawEmail).slice(0, 120);
        // Busca o nome completo no cadastro de logins
        const logins = readCollection('logins');
        const loginUser = logins.find(u => u.email.toLowerCase() === String(rawEmail).toLowerCase());
        if (loginUser && loginUser.name) record.solicitanteNome = String(loginUser.name).slice(0, 120);

        // Persiste o telefone WhatsApp no perfil do login para uso futuro
        if (notifWpp && loginUser && !loginUser.telefone) {
          const telefoneNormalizado = String(notifWpp).replace(/\D/g, '').slice(0, 20);
          loginUser.telefone = telefoneNormalizado;
          const loginsPath = path.join(DADOS_DIR, 'logins.json');
          const allLogins = readCollection('logins');
          const li = allLogins.findIndex(u => u.email.toLowerCase() === String(rawEmail).toLowerCase());
          if (li >= 0) { allLogins[li].telefone = telefoneNormalizado; }
          fs.writeFileSync(loginsPath, JSON.stringify(allLogins, null, 2), 'utf-8');
        }
      }

      const saved = insertCollection('tickets', record);

      sendJson(res, 201, saved);
    });
  },

  // ── Autenticação ────────────────────────────────────────────────────────────

  'POST /api/auth/login': (req, res) => {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      let data;
      try { data = JSON.parse(body); } catch {
        return sendJson(res, 400, { error: 'JSON inválido' });
      }
      const { email, password } = data;
      if (!email || !password) return sendJson(res, 422, { error: 'Email e senha são obrigatórios' });
      const logins = readCollection('logins');
      const user = logins.find(u => u.email.toLowerCase() === String(email).toLowerCase());
      if (!user || user.password !== hashPassword(password)) {
        return sendJson(res, 401, { error: 'Email ou senha incorretos' });
      }
      const token = generateToken();
      // Sessão válida por 8 horas
      sessions.set(token, { id: user.id, email: user.email, role: user.role || 'usuario', expiresAt: Date.now() + 8 * 60 * 60 * 1000 });
      saveSessions(sessions);
      sendJson(res, 200, { token, email: user.email, role: user.role || 'usuario' });
    });
  },

  'POST /api/auth/logout': (req, res) => {
    const auth = req.headers['authorization'] || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (token) { sessions.delete(token); saveSessions(sessions); }
    return sendJson(res, 200, { ok: true });
  },

  'GET /api/auth/verify': (req, res) => {
    const session = getSession(req);
    if (!session) return sendJson(res, 401, { error: 'Sessão inválida' });
    sendJson(res, 200, { email: session.email, role: session.role || 'usuario' });
  },

  // ── Gerenciamento de logins ──────────────────────────────────────────────────

  'GET /api/logins': (req, res) => {
    if (!requireAuth(req, res)) return;
    const logins = readCollection('logins').map(({ password, ...rest }) => rest);
    sendJson(res, 200, { logins });
  },

  'POST /api/logins': (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      let data;
      try { data = JSON.parse(body); } catch {
        return sendJson(res, 400, { error: 'JSON inválido' });
      }
      const { email, password, name, role } = data;
      if (!email || !password) return sendJson(res, 422, { error: 'Email e senha são obrigatórios' });
      const ALLOWED_ROLES = ['administrador', 'supervisor', 'usuario'];
      const normalizedRole = role ? String(role).toLowerCase() : 'usuario';
      if (!ALLOWED_ROLES.includes(normalizedRole)) return sendJson(res, 422, { error: 'Nível de permissão inválido' });
      const logins = readCollection('logins');
      if (logins.find(u => u.email.toLowerCase() === String(email).toLowerCase())) {
        return sendJson(res, 409, { error: 'Email já cadastrado' });
      }
      const record = {
        email: String(email).toLowerCase().slice(0, 120),
        password: hashPassword(String(password)),
        role: normalizedRole,
      };
      if (name) record.name = String(name).slice(0, 120);
      const saved = insertCollection('logins', record);
      const { password: _pw, ...safeUser } = saved;
      sendJson(res, 201, safeUser);
    });
  },

  'DELETE /api/logins': (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      let data;
      try { data = JSON.parse(body); } catch {
        return sendJson(res, 400, { error: 'JSON inválido' });
      }
      const { id } = data;
      if (!id) return sendJson(res, 422, { error: 'id é obrigatório' });
      let logins = readCollection('logins');
      const target = logins.find(u => String(u.id) === String(id));
      if (!target) return sendJson(res, 404, { error: 'Usuário não encontrado' });
      if (target.email.toLowerCase() === session.email.toLowerCase()) {
        return sendJson(res, 400, { error: 'Não é possível remover o próprio usuário' });
      }
      logins = logins.filter(u => String(u.id) !== String(id));
      const loginsPath = path.join(DADOS_DIR, 'logins.json');
      fs.writeFileSync(loginsPath, JSON.stringify(logins, null, 2), 'utf-8');
      sendJson(res, 200, { ok: true });
    });
  },

  /**
   * GET /api/tipos
   * Retorna a lista de tipos de chamado lida de dados/tipos.json
   */
  'GET /api/tipos': (req, res) => {
    const tipos = readCollection('tipos');
    sendJson(res, 200, { tipos });
  },

  // ── Contatos (registros do bot) ────────────────────────────────────────────

  'GET /api/contatos': (req, res) => {
    if (!requireAuth(req, res)) return;
    const contatos = readCollection('contatos');
    const logins = readCollection('logins');
    const enriched = contatos.map(c => {
      if (!c.id_login) return c;
      const login = logins.find(u => String(u.id) === String(c.id_login));
      if (!login) return c;
      return Object.assign({}, c, {
        loginEmail: login.email || null,
        loginName:  login.name  || null,
        loginRole:  login.role  || null,
      });
    });
    sendJson(res, 200, { contatos: enriched });
  },

  /**
   * GET /api/me/contato
   * Retorna o telefone salvo no perfil do usuário logado.
   * Busca primeiro no login, depois tenta cruzar pelo nome em contatos.json.
   */
  'GET /api/me/contato': (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    const logins = readCollection('logins');
    const user = logins.find(u => u.email.toLowerCase() === session.email.toLowerCase());
    if (user && user.telefone) {
      return sendJson(res, 200, { telefone: user.telefone });
    }
    sendJson(res, 200, { telefone: null });
  },

  // ── Salas ──────────────────────────────────────────────────────────────────

  'GET /api/salas': (req, res) => {
    if (!requireAuth(req, res)) return;
    const salas = readCollection('salas');
    sendJson(res, 200, { salas });
  },

  'POST /api/salas': (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    const ALLOWED = ['administrador', 'supervisor'];
    if (!ALLOWED.includes(session.role || 'usuario')) {
      return sendJson(res, 403, { error: 'Sem permissão' });
    }
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      let data;
      try { data = JSON.parse(body); } catch {
        return sendJson(res, 400, { error: 'JSON inválido' });
      }
      const nome = (data.nome || '').trim();
      if (!nome) return sendJson(res, 422, { error: 'Campo "nome" obrigatório' });
      const salas = readCollection('salas');
      if (salas.some(s => s.nome.toLowerCase() === nome.toLowerCase())) {
        return sendJson(res, 409, { error: 'Sala já cadastrada' });
      }
      const nova = { id: Date.now(), nome, createdAt: new Date().toISOString() };
      salas.push(nova);
      const filePath = path.join(DADOS_DIR, 'salas.json');
      fs.writeFileSync(filePath, JSON.stringify(salas, null, 2), 'utf-8');
      sendJson(res, 201, nova);
    });
  },

  'DELETE /api/salas': (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    const ALLOWED = ['administrador', 'supervisor'];
    if (!ALLOWED.includes(session.role || 'usuario')) {
      return sendJson(res, 403, { error: 'Sem permissão' });
    }
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      let data;
      try { data = JSON.parse(body); } catch {
        return sendJson(res, 400, { error: 'JSON inválido' });
      }
      const { id } = data;
      if (!id) return sendJson(res, 422, { error: 'id é obrigatório' });
      let salas = readCollection('salas');
      if (!salas.some(s => String(s.id) === String(id))) {
        return sendJson(res, 404, { error: 'Sala não encontrada' });
      }
      salas = salas.filter(s => String(s.id) !== String(id));
      const filePath = path.join(DADOS_DIR, 'salas.json');
      fs.writeFileSync(filePath, JSON.stringify(salas, null, 2), 'utf-8');
      sendJson(res, 200, { ok: true });
    });
  },

  // ── Configurações ───────────────────────────────────────────────────────────

  'GET /api/config/whatsapp': (req, res) => {
    if (!requireAuth(req, res)) return;
    const config = readCollection('config');
    sendJson(res, 200, {
      ...config.whatsapp,
      status: global._botStatus || 'offline',
      qr: global._botQR || null
    });
  },

  'POST /api/config/whatsapp/status': (req, res) => {
    // Endpoint interno (sem auth por enquanto para simplificar comunicação bot->site)
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        global._botStatus = data.status;
        global._botQR = data.qr;

        // Se o bot reportar um número ao conectar, sincroniza no config.json
        if (data.status === 'connected' && data.numero) {
          const config = readCollection('config');
          config.whatsapp = { numero: data.numero };
          const configPath = path.join(DADOS_DIR, 'config.json');
          fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
        }

        sendJson(res, 200, { ok: true });
      } catch { sendJson(res, 400, { error: 'Invalid JSON' }); }
    });
  },

  'POST /api/config/whatsapp/logout': (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    const ALLOWED = ['administrador', 'supervisor'];
    if (!ALLOWED.includes(session.role || 'usuario')) {
      return sendJson(res, 403, { error: 'Sem permissão' });
    }

    // Chama o bot para fazer logout real do WhatsApp
    const data = JSON.stringify({ secret: process.env.WEBHOOK_SECRET || '' });
    const botReq = http.request({
      hostname: 'localhost',
      port: process.env.WEBHOOK_PORT || 3000,
      path: '/webhook/logout',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }, (botRes) => {
      // Independente do resultado do bot, limpamos a config local se o status for 200 ou se o bot der erro (forçamos)
      const config = readCollection('config');
      config.whatsapp = { numero: '' };
      const configPath = path.join(DADOS_DIR, 'config.json');
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
      
      // Limpa status em memória
      global._botStatus = 'offline';
      global._botQR = null;

      sendJson(res, 200, { ok: true });
    });

    botReq.on('error', () => {
      // Se o bot estiver offline, apenas limpamos a config local
      const config = readCollection('config');
      config.whatsapp = { numero: '' };
      const configPath = path.join(DADOS_DIR, 'config.json');
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
      global._botStatus = 'offline';
      sendJson(res, 200, { ok: true, warning: 'Bot estava offline, config limpa localmente.' });
    });

    botReq.write(data);
    botReq.end();
  },

  'POST /api/config/whatsapp': (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    const ALLOWED = ['administrador', 'supervisor'];
    if (!ALLOWED.includes(session.role || 'usuario')) {
      return sendJson(res, 403, { error: 'Sem permissão' });
    }
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      let data;
      try { data = JSON.parse(body); } catch {
        return sendJson(res, 400, { error: 'JSON inválido' });
      }
      const numero = (data.numero || '').replace(/\D/g, '');
      const config = readCollection('config');
      config.whatsapp = { numero };
      const configPath = path.join(DADOS_DIR, 'config.json');
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
      sendJson(res, 200, { ok: true, whatsapp: config.whatsapp });
    });
  },
};

// ── Server ────────────────────────────────────────────────────────────────────

const server = http.createServer((req, res) => {
  const routeKey = `${req.method} ${req.url.split('?')[0]}`;

  if (ROUTES[routeKey]) {
    return ROUTES[routeKey](req, res);
  }

  // Dynamic route: GET /uploads/:filename
  const uploadsMatch = /^GET \/uploads\/([^/]+)$/.exec(routeKey);
  if (uploadsMatch) {
    const filename = decodeURIComponent(uploadsMatch[1]);
    // Previne path traversal
    if (/[/\\.]\./.test(filename) || filename.includes('/') || filename.includes('\\')) {
      res.writeHead(400); res.end('Invalid filename'); return;
    }
    return sendFile(res, path.join(DADOS_DIR, 'uploads', filename));
  }

  // Dynamic route: GET /api/tickets/:id
  const ticketIdMatch = /^GET \/api\/tickets\/(\d+)$/.exec(routeKey);
  if (ticketIdMatch) {
    const id = Number(ticketIdMatch[1]);
    const tickets = readCollection('tickets');
    let ticket = tickets.find(t => Number(t.id) === id);
    if (!ticket) return sendJson(res, 404, { error: 'Chamado não encontrado' });
    if (!ticket.solicitanteNome || !ticket.solicitanteEmail) {
      const logins = readCollection('logins');
      const match = logins.find(u =>
        (ticket.solicitanteEmail && u.email.toLowerCase() === ticket.solicitanteEmail.toLowerCase()) ||
        (ticket.solicitante && u.email.toLowerCase().startsWith(ticket.solicitante.toLowerCase() + '@'))
      );
      if (match) ticket = Object.assign({}, ticket, {
        solicitanteNome:  match.name  || ticket.solicitanteNome  || ticket.solicitante || '',
        solicitanteEmail: match.email || ticket.solicitanteEmail || '',
      });
    }
    return sendJson(res, 200, ticket);
  }

  // Dynamic route: PATCH /api/tickets/:id
  const patchTicketMatch = /^PATCH \/api\/tickets\/(\d+)$/.exec(routeKey);
  if (patchTicketMatch) {
    const session = requireAuth(req, res);
    if (!session) return;
    const id = Number(patchTicketMatch[1]);
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', async () => {
      let data;
      try { data = JSON.parse(body); } catch {
        return sendJson(res, 400, { error: 'JSON inválido' });
      }
      
      const ALLOWED_STATUS = ['aberto', 'em_atendimento', 'concluido', 'cancelado', 'arquivado'];
      if (data.status && !ALLOWED_STATUS.includes(data.status)) {
        return sendJson(res, 422, { error: 'Status inválido' });
      }
      
      const ticketsPath = require('path').join(DADOS_DIR, 'tickets.json');
      let tickets = readCollection('tickets');
      const idx = tickets.findIndex(t => Number(t.id) === id);
      if (idx === -1) return sendJson(res, 404, { error: 'Chamado não encontrado' });

      const anteriorStatus = tickets[idx].status;
      
      // Atualiza campos permitidos
      if (data.status)      tickets[idx].status      = data.status;
      if (data.observacao)  tickets[idx].observacao  = data.observacao;
      if (data.type)        tickets[idx].type        = data.type;
      if (data.description) tickets[idx].description = data.description;
      if (data.sala)        tickets[idx].sala        = data.sala;
      
      tickets[idx].updatedAt = new Date().toISOString();
      require('fs').writeFileSync(ticketsPath, JSON.stringify(tickets, null, 2), 'utf-8');

      const ticket = tickets[idx];
      const WEBHOOK_PORT = process.env.WEBHOOK_PORT || 3000;
      const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';
      const notifPhone = ticket.notifWpp || (ticket.origem === 'bot' ? ticket.number : null);
      const origemNotif = !!notifPhone;

      let emailResult = null;
      if (data.status === 'concluido' && anteriorStatus !== 'concluido' && !notifPhone) {
        const destEmail = ticket.solicitanteEmail || null;
        if (destEmail) {
          const logins = readCollection('logins');
          const atendenteLogin = logins.find(u => u.email.toLowerCase() === session.email.toLowerCase());
          const atendenteNome = (atendenteLogin && atendenteLogin.name) ? atendenteLogin.name : session.email;
          emailResult = await sendConclusaoEmail({
            toEmail:         destEmail,
            solicitanteNome: ticket.solicitanteNome || ticket.solicitante || '',
            atendenteNome,
            ticketId:        ticket.id,
            ticketTipo:      ticket.type,
          });
          emailResult.to = destEmail;
        }
      }

      sendJson(res, 200, emailResult ? Object.assign({}, ticket, { emailResult }) : ticket);

      if (data.status === 'em_atendimento' && anteriorStatus !== 'em_atendimento' && origemNotif) {
        const payload = JSON.stringify({ secret: WEBHOOK_SECRET, telefone: notifPhone, id: ticket.id, tipo: ticket.type, atendente: session.email });
        const whReq = require('http').request(
          { hostname: 'localhost', port: WEBHOOK_PORT, path: '/webhook/chamado-assumido', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } },
          (whRes) => { whRes.resume(); console.log(`[site] webhook assumido: ${whRes.statusCode}`); }
        );
        whReq.on('error', (e) => console.warn('[site] webhook indisponível:', e.message));
        whReq.write(payload);
        whReq.end();
      }
    });
    return;
  }

  // Dynamic route: DELETE /api/tickets/:id
  const deleteTicketMatch = /^DELETE \/api\/tickets\/(\d+)$/.exec(routeKey);
  if (deleteTicketMatch) {
    const session = requireAuth(req, res);
    if (!session) return;
    const id = Number(deleteTicketMatch[1]);
    const ticketsPath = require('path').join(DADOS_DIR, 'tickets.json');
    let tickets = readCollection('tickets');
    const filtered = tickets.filter(t => Number(t.id) !== id);
    if (tickets.length === filtered.length) return sendJson(res, 404, { error: 'Chamado não encontrado' });
    require('fs').writeFileSync(ticketsPath, JSON.stringify(filtered, null, 2), 'utf-8');
    return sendJson(res, 200, { ok: true });
  }

      // Notifica o bot quando o chamado for concluído (fire-and-forget)
      if (
        data.status === 'concluido' &&
        anteriorStatus !== 'concluido' &&
        origemNotif
      ) {
        const payload = JSON.stringify({
          secret:    WEBHOOK_SECRET,
          telefone:  notifPhone,
          id:        ticket.id,
          tipo:      ticket.type,
        });
        const whReq = require('http').request(
          { hostname: 'localhost', port: WEBHOOK_PORT, path: '/webhook/chamado-concluido', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } },
          (whRes) => { whRes.resume(); console.log(`[site] webhook concluido: ${whRes.statusCode}`); }
        );
        whReq.on('error', (e) => console.warn('[site] webhook indisponível:', e.message));
        whReq.write(payload);
        whReq.end();
      }
    });
    return;
  }

  // Serve arquivos estáticos de public/
  const urlPath = req.url === '/' ? '/index.html' : req.url;
  sendFile(res, path.join(PUBLIC_DIR, urlPath));
});

initLogins();

server.listen(PORT, () => {
  console.log(`[site] Rodando em http://localhost:${PORT}`);
});
