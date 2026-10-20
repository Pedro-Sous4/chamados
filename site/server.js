
function normalizeColabStr(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^lgm\s*-\s*/i, '')
    .replace(/^car\s*-\s*/i, '')
    .trim();
}

function findColaboradorMatch(allColaboradores, contatos, { sEmail, sNome, realNumber, number }) {
  if (sEmail && sEmail !== '-') {
    const m = allColaboradores.find(c => c.email && c.email.toLowerCase() === sEmail.toLowerCase());
    if (m) return m;
  }

  const normSNome = normalizeColabStr(sNome);

  // Match por nome
  if (normSNome && normSNome !== '-' && normSNome !== 'bot') {
    const m = allColaboradores.find(c => {
      const cNorm = normalizeColabStr(c.nome);
      return cNorm === normSNome || cNorm.includes(normSNome) || normSNome.includes(cNorm);
    });
    if (m) return m;
  }

  // Match por telefone ou LID
  const tReal = String(realNumber || '').replace(/\D/g, '');
  const tNum = String(number || '').replace(/\D/g, '');

  if (tReal || tNum) {
    const m = allColaboradores.find(c => {
      if (!c.telefone) return false;
      const colabTel = String(c.telefone).replace(/\D/g, '');
      if (!colabTel) return false;

      if (colabTel === tReal || colabTel === tNum || tReal.endsWith(colabTel) || tNum.endsWith(colabTel) || colabTel.endsWith(tReal) || colabTel.endsWith(tNum)) {
        return true;
      }
      if (colabTel.length >= 8 && tReal.length >= 8 && colabTel.slice(-8) === tReal.slice(-8)) return true;
      return false;
    });
    if (m) return m;
  }

  return null;
}

﻿const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// â”€â”€ Configuração de e-mail â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
      subject: `Chamado #${ticketId} â€” ${ticketTipo} concluído`,
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

async function sendNovoChamadoAlert(ticket) {
  try {
    const config = readCollection('config');
    const toEmail = (config && (config.email_alerta || config.emailAlerta)) || 'ti3@laghettomultipropriedade.com.br';
    if (!toEmail) return { ok: false, error: 'E-mail de alerta não configurado' };

    const dataHora = new Date().toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: 'America/Sao_Paulo',
    });

    const ticketId = ticket.id || 'N/A';
    const tipo = ticket.type || 'Suporte';
    const solicitante = ticket.solicitanteNome || ticket.name || ticket.solicitante || 'Não informado';
    const telefone = ticket.realNumber || ticket.number || ticket.telefone || 'Não informado';
    const salaSetor = ticket.sala || 'Não informado';
    const origemNome = ticket.origem === 'site' ? 'Site' : 'WhatsApp Bot';
    const descricao = ticket.description || 'Sem descrição';

    const subject = `[Novo Chamado #${ticketId}] ${tipo} — ${solicitante} (${origemNome})`;

    const text =
      `Central de Chamados TI Laghetto\n` +
      `Um novo chamado foi aberto no sistema.\n\n` +
      `ID/Protocolo: #${ticketId}\n` +
      `Origem: ${origemNome}\n` +
      `Tipo: ${tipo}\n` +
      `Solicitante: ${solicitante}\n` +
      `Telefone/Contato: ${telefone}\n` +
      `Sala / Setor: ${salaSetor}\n` +
      `Data/Hora: ${dataHora}\n\n` +
      `Descrição:\n${descricao}\n\n` +
      `Acesse a Central de Chamados para atender.`;

    const html =
      `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">` +
        `<div style="background: #925616; padding: 20px 24px; color: #ffffff;">` +
          `<h2 style="margin: 0; font-size: 18px; font-weight: 700;">Novo Chamado Aberto #${ticketId}</h2>` +
          `<p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Recebido via <strong>${origemNome}</strong></p>` +
        `</div>` +
        `<div style="padding: 24px;">` +
          `<table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">` +
            `<tr><td style="padding: 8px 0; color: #6b7280; width: 140px; font-weight: 600;">Protocolo:</td><td style="padding: 8px 0; color: #111827; font-weight: 700;">#${ticketId}</td></tr>` +
            `<tr><td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Origem:</td><td style="padding: 8px 0; color: #111827;">${origemNome}</td></tr>` +
            `<tr><td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Tipo de Demanda:</td><td style="padding: 8px 0; color: #111827; font-weight: 600;">${tipo}</td></tr>` +
            `<tr><td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Solicitante:</td><td style="padding: 8px 0; color: #111827; font-weight: 600;">${solicitante}</td></tr>` +
            `<tr><td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Telefone:</td><td style="padding: 8px 0; color: #111827;">${telefone}</td></tr>` +
            `<tr><td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Sala / Setor:</td><td style="padding: 8px 0; color: #111827;">${salaSetor}</td></tr>` +
            `<tr><td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Data e Hora:</td><td style="padding: 8px 0; color: #111827;">${dataHora}</td></tr>` +
          `</table>` +
          `<div style="background: #f9fafb; border-left: 4px solid #925616; padding: 14px; border-radius: 6px; margin-bottom: 20px;">` +
            `<p style="margin: 0 0 6px; font-weight: 700; color: #374151; font-size: 13px; text-transform: uppercase;">Descrição do Problema:</p>` +
            `<p style="margin: 0; color: #1f2937; font-size: 14px; line-height: 1.5; white-space: pre-wrap;">${descricao.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>` +
          `</div>` +
          `<p style="margin: 0; font-size: 12px; color: #9ca3af;">Este alerta automático foi gerado pela Central de Chamados Laghetto.</p>` +
        `</div>` +
      `</div>`;

    await mailer.sendMail({
      from: `"Central de Chamados Laghetto" <${SMTP_USER}>`,
      to: toEmail,
      subject,
      text,
      html,
    });
    console.log(`[email] Alerta de novo chamado #${ticketId} enviado para ${toEmail}`);
    return { ok: true };
  } catch (err) {
    console.warn(`[email] Falha ao enviar alerta de novo chamado:`, err.message);
    return { ok: false, error: err.message };
  }
}

// â”€â”€ Utilitário de escrita em coleção (espelho simplificado do storage do bot) â”€
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

// â”€â”€ Auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

function getAtendenteNome(req, session, fallback = 'Pedro Sousa') {
  if (session && session.email) {
    const logins = readCollection('logins');
    const user = logins.find(u => u.email.toLowerCase() === session.email.toLowerCase());
    if (user && user.name) return user.name;
    return session.email;
  }
  return fallback;
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

function parseCSV(text) {
  // Remove BOM (Byte Order Mark) e espaços/quebras extras do início do texto
  text = text.replace(/^[\uFEFF\uFFFE]/, '').trim();
  const lines = text.split(/\r?\n/);
  if (lines.length < 2) return [];
  
  // Identifica o separador (vírgula ou ponto e vírgula)
  const firstLine = lines[0];
  const separator = firstLine.includes(';') ? ';' : ',';
  
  // Função auxiliar para dividir linha respeitando aspas
  function splitCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === separator && !inQuotes) {
        result.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^"|"$/g, ''));
    return result;
  }
  
  const headers = splitCSVLine(lines[0]).map(h => h.toLowerCase().trim());
  
  // Mapeamento comum do Google Contacts para Nome (PT e EN)
  const firstNameIdx = headers.findIndex(h => h === 'first name' || h === 'given name' || h === 'nome próprio' || h === 'nome proprio' || h === 'prenome');
  const middleNameIdx = headers.findIndex(h => h === 'middle name' || h === 'additional name' || h === 'nome do meio');
  const lastNameIdx = headers.findIndex(h => h === 'last name' || h === 'family name' || h === 'sobrenome');
  const fullNameIdx = headers.findIndex(h => h === 'name' || h === 'nome' || h === 'display name' || h === 'nome de exibição' || h === 'nome de exibicao' || h === 'nome completo');

  // Encontra todos os índices de colunas que parecem telefones, excluindo campos fonéticos ou rótulos
  const phoneIdxs = [];
  headers.forEach((h, idx) => {
    if ((h.includes('phone') || h.includes('telef') || h.includes('celular') || h.includes('fone') || h.includes('mobile')) && !h.includes('phonetic') && !h.includes('label')) {
      phoneIdxs.push(idx);
    }
  });

  const contacts = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const row = splitCSVLine(line);
    if (row.length === 0) continue;
    
    // Constrói o nome combinando colunas se disponíveis
    let nome = '';
    if (firstNameIdx >= 0 && row[firstNameIdx]) {
      const parts = [
        row[firstNameIdx],
        middleNameIdx >= 0 ? row[middleNameIdx] : '',
        lastNameIdx >= 0 ? row[lastNameIdx] : ''
      ].filter(Boolean).map(p => p.trim());
      nome = parts.join(' ');
    }
    
    // Fallback para coluna de nome completo se o composto estiver vazio
    if (!nome.trim() && fullNameIdx >= 0 && row[fullNameIdx]) {
      nome = row[fullNameIdx].trim();
    }
    
    // Se ainda não tem nome, tenta achar qualquer coluna contendo "name" ou "nome"
    if (!nome.trim()) {
      const anyNameIdx = headers.findIndex(h => h.includes('name') || h.includes('nome'));
      if (anyNameIdx >= 0 && row[anyNameIdx]) {
        nome = row[anyNameIdx].trim();
      }
    }
    
    // Busca o telefone nas colunas de telefone identificadas
    let phoneDigits = '';
    for (const idx of phoneIdxs) {
      if (idx < row.length && row[idx]) {
        const val = row[idx].trim();
        // Pega a primeira parte se estiver separada por ::: ou ; ou outro delimitador comum
        const parts = val.split(/:::|;/);
        for (const part of parts) {
          const digits = part.replace(/\D/g, '');
          if (digits.length >= 8) {
            phoneDigits = digits;
            break;
          }
        }
        if (phoneDigits) break;
      }
    }

    // Fallback: se não achou em colunas mapeadas, varre todas as colunas atrás de algo que pareça número de telefone
    if (!phoneDigits) {
      for (let idx = 0; idx < row.length; idx++) {
        const val = row[idx] ? row[idx].trim() : '';
        if (val) {
          const parts = val.split(/:::|;/);
          for (const part of parts) {
            const digits = part.replace(/\D/g, '');
            if (digits.length >= 8 && digits.length <= 15) {
              phoneDigits = digits;
              break;
            }
          }
        }
        if (phoneDigits) break;
      }
    }
    
    if (nome.trim() && phoneDigits) {
      contacts.push({
        nome: nome.trim(),
        numero: phoneDigits
      });
    }
  }
  return contacts;
}

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
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  if (fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
    if (!fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
  }

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

  res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain', 'Cache-Control': ext === '.html' ? 'no-cache, no-store, must-revalidate' : 'public, max-age=3600' });
  fs.createReadStream(filePath).pipe(res);
}

// â”€â”€ Roteador â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

      // Setor (Sala) - Pega apenas o sub-setor final
      const salaStr = t.sala || 'Não Informado';
      let salaBase = salaStr;
      if (salaStr.includes(' - ')) {
        salaBase = salaStr.split(' - ')[1];
      } else if (salaStr.includes('Administrativo')) {
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

    const logins = readCollection('logins');
    const contatos = readCollection('contatos');
    const colsData = readCollection('colaboradores');
    
    // Flat map de todos os colaboradores
    let allColaboradores = [];
    const root = Array.isArray(colsData) ? colsData[0] : colsData;
    if (root) {
        allColaboradores = [...(root.lideranca || [])];
        const extractDeep = (sectors) => {
          if (!sectors) return;
          sectors.forEach(s => {
            if (s.colaboradores) allColaboradores.push(...s.colaboradores);
            if (s.subsetores) extractDeep(s.subsetores);
          });
        };
        extractDeep(root.setores);
      }

    tickets = tickets.map(t => {
      let resolvedName = t.name;
      let realNumber = t.number;
      if (t.number) {
        const contato = contatos.find(c => String(c.numero).replace(/\D/g, '') === String(t.number).replace(/\D/g, ''));
        if (contato && contato.nome) {
          resolvedName = contato.nome;
          
          const contatoReal = contatos.find(c => c.nome === contato.nome && c.numero && c.numero.length >= 10 && c.numero.length <= 13 && c.numero !== contato.numero);
          if (contatoReal) {
            realNumber = contatoReal.numero;
          }
        }
      }
      
      let enrichedTicket = Object.assign({}, t, { name: resolvedName, realNumber: realNumber });

      let match = logins.find(u =>
        (enrichedTicket.solicitanteEmail && u.email.toLowerCase() === enrichedTicket.solicitanteEmail.toLowerCase()) ||
        (enrichedTicket.solicitante && u.email.toLowerCase().startsWith(enrichedTicket.solicitante.toLowerCase() + '@'))
      );
      if (!match && enrichedTicket.number) {
        const contato = contatos.find(c => String(c.numero).replace(/\D/g, '') === String(enrichedTicket.number).replace(/\D/g, ''));
        if (contato && contato.id_login) {
          match = logins.find(u => String(u.id) === String(contato.id_login));
        }
      }
      
      const sNome = match ? match.name : (enrichedTicket.solicitanteNome || enrichedTicket.name || enrichedTicket.solicitante || '');
      const sEmail = match ? match.email : (enrichedTicket.solicitanteEmail || enrichedTicket.solicitante || '');

      enrichedTicket.solicitanteNome = sNome;
      enrichedTicket.solicitanteEmail = sEmail;

            // Link com o organograma
      let colabMatch = findColaboradorMatch(allColaboradores, contatos, { sEmail, sNome, realNumber, number: t.number });

      if (colabMatch) {
        enrichedTicket.colabId = colabMatch.id;
        enrichedTicket.foto = colabMatch.foto;
        enrichedTicket.cargo = colabMatch.cargo;
        enrichedTicket.colabSetor = colabMatch.setor;
        enrichedTicket.solicitanteNome = colabMatch.nome;
      }

      return enrichedTicket;
    });

    if (filterQ) {
      tickets = tickets.filter(t =>
        String(t.id).includes(filterQ) ||
        (t.name             || '').toLowerCase().includes(filterQ) ||
        (t.number           || '').toLowerCase().includes(filterQ) ||
        (t.description      || '').toLowerCase().includes(filterQ) ||
        (t.solicitanteNome  || '').toLowerCase().includes(filterQ) ||
        (t.solicitanteEmail || '').toLowerCase().includes(filterQ) ||
        (t.solicitante      || '').toLowerCase().includes(filterQ) ||
        (t.sala             || '').toLowerCase().includes(filterQ)
      );
    }

    sendJson(res, 200, { total: tickets.length, tickets });
  },

  /**
   * POST /api/tickets
   * Body JSON: { name, number, type, description }
   */
    'POST /api/tickets/direct': (req, res) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (!data.telefone) return sendJson(res, 400, { error: 'Telefone é obrigatório' });
        
        const ticketsPath = require('path').join(DADOS_DIR, 'tickets.json');
        let tickets = readCollection('tickets');
        const newId = tickets.length > 0 ? Math.max(...tickets.map(t => Number(t.id))) + 1 : 1;
        
        // Buscar histórico anterior de conversas desse contato/colaborador
        const contatos = readCollection('contatos');
        const telLimpo = String(data.telefone || '').replace(/\D/g, '');
        const nomeNorm = normalizeColabStr(data.nome);
        
        let relatedNums = new Set([telLimpo]);
        contatos.forEach(ct => {
          const ctNum = String(ct.numero || '').replace(/\D/g, '');
          const ctNorm = normalizeColabStr(ct.nome);
          if (!ctNum) return;
          if (telLimpo && (ctNum === telLimpo || (telLimpo.length >= 8 && ctNum.endsWith(telLimpo.slice(-8))))) {
            relatedNums.add(ctNum);
            contatos.filter(o => o.nome === ct.nome).forEach(o => relatedNums.add(String(o.numero).replace(/\D/g, '')));
          }
          if (nomeNorm && (ctNorm === nomeNorm || ctNorm.includes(nomeNorm) || nomeNorm.includes(ctNorm))) {
            relatedNums.add(ctNum);
            contatos.filter(o => o.nome === ct.nome).forEach(o => relatedNums.add(String(o.numero).replace(/\D/g, '')));
          }
        });

        const prevTicket = tickets.slice().reverse().find(t => {
          if (!t.conversa || t.conversa.length === 0) return false;
          const tSol = normalizeColabStr(t.solicitanteNome);
          const tName = normalizeColabStr(t.name);
          if (nomeNorm && (tSol === nomeNorm || tName === nomeNorm || tSol.includes(nomeNorm) || tName.includes(nomeNorm))) return true;
          const tNum = String(t.number || '').replace(/\D/g, '');
          const tReal = String(t.realNumber || '').replace(/\D/g, '');
          for (const num of relatedNums) {
            if (!num) continue;
            if (num === tNum || num.endsWith(tNum) || tNum.endsWith(num)) return true;
            if (tReal && (num === tReal || num.endsWith(tReal) || tReal.endsWith(num))) return true;
          }
          return false;
        });

        const initialConversa = prevTicket ? [...prevTicket.conversa] : [];

        const newTicket = {
          id: String(newId),
          status: 'em_atendimento',
          origem: 'bot',
          number: data.telefone,
          name: data.nome || 'Usuário',
          solicitanteNome: data.nome || 'Usuário',
          type: 'Mensagem Direta',
          description: 'Atendimento direto iniciado via Organograma.',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          conversa: initialConversa
        };
        
        tickets.push(newTicket);
        fs.writeFileSync(ticketsPath, JSON.stringify(tickets, null, 2), 'utf-8');
        
        // Identifica o atendente logado
        const session = getSession(req);
        const atendenteNome = getAtendenteNome(req, session, data.atendente || 'Pedro Sousa');

        // Pause the bot (set to em_atendimento)
        const WEBHOOK_PORT = process.env.WEBHOOK_PORT || 3000;
        const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';
        const payload = JSON.stringify({ secret: WEBHOOK_SECRET, telefone: data.telefone, id: newTicket.id, tipo: 'Mensagem Direta', atendente: atendenteNome });
        
        const whReq = require('http').request(
          { hostname: 'localhost', port: WEBHOOK_PORT, path: '/webhook/chamado-assumido', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } },
          (whRes) => { whRes.resume(); console.log(`[site] webhook assumido direto: ${whRes.statusCode}`); }
        );
        whReq.on('error', (e) => console.warn('[site] webhook indisponível:', e.message));
        whReq.write(payload);
        whReq.end();

        // Dispara e-mail de alerta assíncrono para o TI
        sendNovoChamadoAlert(newTicket).catch(e => console.warn('[site] Erro alerta direto:', e.message));

        return sendJson(res, 200, { ok: true, ticketId: newTicket.id });
      } catch (e) {
        return sendJson(res, 400, { error: 'Invalid JSON' });
      }
    });
  },

  'POST /api/tickets': (req, res) => {
    const session = getSession(req);

    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      let body = Buffer.concat(chunks).toString('utf-8');
      let data;
      try { data = JSON.parse(body); } catch {
        return sendJson(res, 400, { error: 'JSON inválido' });
      }

      const { name, number, type, description, notifWpp, solicitante, origem, sala } = data;
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
        sala: sala ? String(sala).slice(0, 120) : 'Não informado',
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

      // Cria o contato automaticamente se não existir
      if (record.number) {
        const contatosPath = path.join(DADOS_DIR, 'contatos.json');
        const contatos = readCollection('contatos');
        const normalizedNum = String(record.number).replace(/\D/g, '');
        const exists = contatos.some(c => String(c.numero).replace(/\D/g, '') === normalizedNum);
        if (!exists) {
          contatos.push({
            id: Date.now(),
            createdAt: new Date().toISOString(),
            numero: normalizedNum,
            nome: record.name
          });
          fs.writeFileSync(contatosPath, JSON.stringify(contatos, null, 2), 'utf-8');
        }
      }

      // Dispara e-mail de alerta assíncrono para o TI
      sendNovoChamadoAlert(saved).catch(e => console.warn('[site] Erro alerta ticket:', e.message));

      sendJson(res, 201, saved);
    });
  },

  'POST /api/link-colaborador': (req, res) => {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      let data;
      try { data = JSON.parse(body); } catch { return sendJson(res, 400, { error: 'JSON inválido' }); }
      const { numero_origem, nome_colaborador } = data;
      if (!numero_origem || !nome_colaborador) return sendJson(res, 400, { error: 'Faltam dados' });

      let contatos = readCollection('contatos');
      let c = contatos.find(x => String(x.numero).replace(/\D/g, '') === String(numero_origem).replace(/\D/g, ''));
      if (c) {
        c.nome = nome_colaborador;
      } else {
        contatos.push({
          id: Date.now(),
          createdAt: new Date().toISOString(),
          numero: numero_origem,
          nome: nome_colaborador
        });
      }
      fs.writeFileSync(path.join(DADOS_DIR, 'contatos.json'), JSON.stringify(contatos, null, 2), 'utf-8');
      sendJson(res, 200, { ok: true });
    });
  },

  // â”€â”€ Autenticação â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
      sessions.set(token, { id: user.id, email: user.email, name: user.name || '', role: user.role || 'usuario', expiresAt: Date.now() + 8 * 60 * 60 * 1000 });
      saveSessions(sessions);
      sendJson(res, 200, { token, email: user.email, name: user.name || '', role: user.role || 'usuario' });
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
    const logins = readCollection('logins');
    const user = logins.find(u => u.email.toLowerCase() === session.email.toLowerCase());
    const name = (user && user.name) ? user.name : (session.name || '');
    sendJson(res, 200, { email: session.email, name, role: session.role || 'usuario' });
  },

  // â”€â”€ Organograma â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  'GET /api/colaboradores': (req, res) => {
    // Tenta ler do banco
    const cols = readCollection('colaboradores');
    if (Array.isArray(cols)) {
      if (cols.length === 0) return sendJson(res, 200, { lideranca: [], setores: [] });
      return sendJson(res, 200, cols[0]);
    }
    sendJson(res, 200, cols);
  },

    'POST /api/bot/broadcast': (req, res) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      let data;
      try { data = JSON.parse(Buffer.concat(chunks).toString('utf-8')); } catch { return sendJson(res, 400, { error: 'JSON inválido' }); }
      if (!data.telefones || !data.mensagem) return sendJson(res, 400, { error: 'Faltam dados' });
      
      const telefones = data.telefones;
      let count = 0;
      telefones.forEach(tel => {
        const payload = JSON.stringify({ secret: process.env.WEBHOOK_SECRET || '', telefone: tel, mensagem: data.mensagem });
        const whReq = require('http').request(
          { hostname: 'localhost', port: process.env.WEBHOOK_PORT || 3000, path: '/webhook/mensagem-direta', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } },
          (whRes) => { whRes.resume(); }
        );
        whReq.on('error', () => {});
        whReq.write(payload);
        whReq.end();
        count++;
      });
      sendJson(res, 200, { ok: true, count });
    });
  },

  'POST /api/colaboradores': (req, res) => {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      let data;
      try { data = JSON.parse(body); } catch { return sendJson(res, 400, { error: 'JSON inválido' }); }
      
      const colPath = path.join(DADOS_DIR, 'colaboradores.json');
      // Salva diretamente como o objeto
      fs.writeFileSync(colPath, JSON.stringify(data, null, 2), 'utf-8');
      sendJson(res, 200, { ok: true });
    });
  },

  // ── Inventário de TI ────────────────────────────────────────────────────────

  'GET /api/inventario': (req, res) => {
    const invPath = path.join(DADOS_DIR, 'inventario.json');
    if (!fs.existsSync(invPath)) {
      return sendJson(res, 200, { computadores: [], perifericos: [], rede: [], emprestimos: [] });
    }
    try {
      const data = JSON.parse(fs.readFileSync(invPath, 'utf-8'));
      sendJson(res, 200, data);
    } catch (err) {
      sendJson(res, 500, { error: 'Erro ao carregar inventário' });
    }
  },

  'POST /api/inventario': (req, res) => {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      let data;
      try { data = JSON.parse(body); } catch { return sendJson(res, 400, { error: 'JSON inválido' }); }

      const invPath = path.join(DADOS_DIR, 'inventario.json');
      let inv = { computadores: [], perifericos: [], rede: [], emprestimos: [] };
      if (fs.existsSync(invPath)) {
        try { inv = JSON.parse(fs.readFileSync(invPath, 'utf-8')); } catch {}
      }

      const category = data.category || 'computadores';
      if (!inv[category]) inv[category] = [];

      const newItem = {
        id: (category.slice(0, 3) || 'it') + '-' + Date.now(),
        createdAt: new Date().toISOString(),
        ...data.item
      };
      inv[category].unshift(newItem);

      fs.writeFileSync(invPath, JSON.stringify(inv, null, 2), 'utf-8');
      sendJson(res, 201, { ok: true, item: newItem });
    });
  },

  'PATCH /api/inventario': (req, res) => {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      let data;
      try { data = JSON.parse(body); } catch { return sendJson(res, 400, { error: 'JSON inválido' }); }

      const invPath = path.join(DADOS_DIR, 'inventario.json');
      if (!fs.existsSync(invPath)) return sendJson(res, 404, { error: 'Inventário não encontrado' });

      let inv = JSON.parse(fs.readFileSync(invPath, 'utf-8'));
      const { id, category, updates } = data;

      let found = false;
      const targetCat = category || ['computadores', 'perifericos', 'rede', 'emprestimos'];
      const categoriesToCheck = Array.isArray(targetCat) ? targetCat : [targetCat];

      for (let cat of categoriesToCheck) {
        if (inv[cat]) {
          const idx = inv[cat].findIndex(item => String(item.id) === String(id));
          if (idx !== -1) {
            inv[cat][idx] = { ...inv[cat][idx], ...updates, updatedAt: new Date().toISOString() };
            found = true;
            break;
          }
        }
      }

      if (!found) return sendJson(res, 404, { error: 'Item não encontrado no inventário' });

      fs.writeFileSync(invPath, JSON.stringify(inv, null, 2), 'utf-8');
      sendJson(res, 200, { ok: true });
    });
  },

  'DELETE /api/inventario': (req, res) => {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      let data;
      try { data = JSON.parse(body); } catch { return sendJson(res, 400, { error: 'JSON inválido' }); }

      const invPath = path.join(DADOS_DIR, 'inventario.json');
      if (!fs.existsSync(invPath)) return sendJson(res, 404, { error: 'Inventário não encontrado' });

      let inv = JSON.parse(fs.readFileSync(invPath, 'utf-8'));
      const { id } = data;

      let removed = false;
      ['computadores', 'perifericos', 'rede', 'emprestimos'].forEach(cat => {
        if (inv[cat]) {
          const lenBefore = inv[cat].length;
          inv[cat] = inv[cat].filter(item => String(item.id) !== String(id));
          if (inv[cat].length < lenBefore) removed = true;
        }
      });

      if (!removed) return sendJson(res, 404, { error: 'Item não encontrado' });

      fs.writeFileSync(invPath, JSON.stringify(inv, null, 2), 'utf-8');
      sendJson(res, 200, { ok: true });
    });
  },

  'POST /api/upload-figurinha': (req, res) => {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      let data;
      try { 
        data = JSON.parse(body); 
      } catch (e) { 
        console.error('[upload] Erro parse JSON', e.message);
        return sendJson(res, 400, { error: 'JSON inválido' }); 
      }
      
      if (!data.foto || !data.nome) {
        console.error('[upload] Falta foto ou nome');
        return sendJson(res, 400, { error: 'Faltam foto ou nome' });
      }

      console.log(`[upload] Recebida foto ${data.nome}, tamanho string: ${data.foto.length}`);

      const matches = data.foto.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        console.error('[upload] Formato base64 invalido');
        return sendJson(res, 400, { error: 'Formato base64 inválido' });
      }

      const buffer = Buffer.from(matches[2], 'base64');
      const ext = path.extname(data.nome) || '.png';
      const fileName = `colab_${Date.now()}${ext}`;
      
      const uploadDir = path.join(PUBLIC_DIR, 'figurinhas');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, buffer);

      console.log(`[upload] Salvo em ${filePath}`);
      sendJson(res, 200, { url: `/figurinhas/${fileName}` });
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

  // â”€â”€ Contatos (registros do bot) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

  'PUT /api/contatos': (req, res) => {
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
      try { data = JSON.parse(body); } catch { return sendJson(res, 400, { error: 'JSON inválido' }); }
      const { numero, nome } = data;
      if (!numero || !nome) return sendJson(res, 422, { error: 'Número e nome são obrigatórios' });

      const contatosPath = path.join(DADOS_DIR, 'contatos.json');
      let contatos = readCollection('contatos');
      const normalizedNum = String(numero).replace(/\D/g, '');
      const idx = contatos.findIndex(c => String(c.numero).replace(/\D/g, '') === normalizedNum);

      if (idx >= 0) {
        contatos[idx].nome = nome;
        contatos[idx].updatedAt = new Date().toISOString();
      } else {
        contatos.push({
          id: Date.now(),
          createdAt: new Date().toISOString(),
          numero: normalizedNum,
          nome: nome
        });
      }
      fs.writeFileSync(contatosPath, JSON.stringify(contatos, null, 2), 'utf-8');
      sendJson(res, 200, { ok: true });
    });
  },

  'POST /api/contatos/import': (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    const ALLOWED = ['administrador', 'supervisor'];
    if (!ALLOWED.includes(session.role || 'usuario')) {
      return sendJson(res, 403, { error: 'Sem permissão' });
    }

    // Chama o bot local para importar todos os contatos ativos
    const data = JSON.stringify({ secret: process.env.WEBHOOK_SECRET || '' });
    const botReq = http.request({
      hostname: 'localhost',
      port: process.env.WEBHOOK_PORT || 3000,
      path: '/webhook/import-contacts',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }, (botRes) => {
      let body = '';
      botRes.on('data', chunk => (body += chunk));
      botRes.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (botRes.statusCode === 200) {
            sendJson(res, 200, parsed);
          } else {
            sendJson(res, botRes.statusCode, { error: parsed.error || 'Erro do bot ao importar' });
          }
        } catch {
          sendJson(res, 500, { error: 'Resposta inválida do bot' });
        }
      });
    });

    botReq.on('error', () => {
      sendJson(res, 503, { error: 'Bot offline. O bot do WhatsApp precisa estar rodando para importar contatos.' });
    });

    botReq.write(data);
    botReq.end();
  },

  'POST /api/contatos/import-csv': (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    const ALLOWED = ['administrador', 'supervisor'];
    if (!ALLOWED.includes(session.role || 'usuario')) {
      return sendJson(res, 403, { error: 'Sem permissão' });
    }

    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      try {
        const contacts = parseCSV(body);
        if (contacts.length === 0) {
          return sendJson(res, 400, { error: 'Nenhum contato válido encontrado no CSV. Verifique se o arquivo possui colunas de Nome e Telefone.' });
        }

        const contatosPath = path.join(DADOS_DIR, 'contatos.json');
        let contatos = readCollection('contatos');
        let importedCount = 0;

        contacts.forEach(c => {
          let num = c.numero;
          // Se for Brasil e não tiver DDI (55), adiciona se tiver 10 ou 11 dígitos
          if (num.length === 11 || num.length === 10) {
            if (!num.startsWith('55')) num = '55' + num;
          }

          const idx = contatos.findIndex(item => String(item.numero).replace(/\D/g, '') === num);
          if (idx === -1) {
            contatos.push({
              id: Date.now() + Math.floor(Math.random() * 1000),
              createdAt: new Date().toISOString(),
              numero: num,
              nome: c.nome
            });
            importedCount++;
          } else if (!contatos[idx].nome || contatos[idx].nome === contatos[idx].numero) {
            contatos[idx].nome = c.nome;
            contatos[idx].updatedAt = new Date().toISOString();
            importedCount++;
          }
        });

        if (importedCount > 0) {
          fs.writeFileSync(contatosPath, JSON.stringify(contatos, null, 2), 'utf-8');
        }

        sendJson(res, 200, { ok: true, imported: importedCount });
      } catch (err) {
        console.error('[csv-import] erro ao processar CSV:', err.message);
        sendJson(res, 500, { error: 'Erro ao processar arquivo CSV.' });
      }
    });
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

  // â”€â”€ Logins â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  
  'GET /api/logins': (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    const ALLOWED = ['administrador', 'supervisor'];
    if (!ALLOWED.includes(session.role || 'usuario')) {
      return sendJson(res, 403, { error: 'Sem permissão' });
    }
    const logins = readCollection('logins').map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role }));
    sendJson(res, 200, { logins });
  },

  'POST /api/logins': (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    if (session.role !== 'administrador') return sendJson(res, 403, { error: 'Sem permissão' });
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      let data;
      try { data = JSON.parse(body); } catch { return sendJson(res, 400, { error: 'JSON inválido' }); }
      if (!data.email || !data.password) return sendJson(res, 422, { error: 'Email e senha são obrigatórios' });
      const logins = readCollection('logins');
      if (logins.some(u => u.email.toLowerCase() === data.email.toLowerCase())) {
        return sendJson(res, 409, { error: 'E-mail já cadastrado' });
      }
      const novo = { 
        id: Date.now(), 
        name: data.name || '', 
        email: data.email.toLowerCase(), 
        password: hashPassword(data.password), 
        role: data.role || 'usuario',
        createdAt: new Date().toISOString()
      };
      logins.push(novo);
      fs.writeFileSync(path.join(DADOS_DIR, 'logins.json'), JSON.stringify(logins, null, 2), 'utf-8');
      sendJson(res, 201, { ok: true });
    });
  },

  'DELETE /api/logins': (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    if (session.role !== 'administrador') return sendJson(res, 403, { error: 'Sem permissão' });
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      let data;
      try { data = JSON.parse(body); } catch { return sendJson(res, 400, { error: 'JSON inválido' }); }
      if (!data.id) return sendJson(res, 422, { error: 'id é obrigatório' });
      let logins = readCollection('logins');
      if (!logins.some(u => String(u.id) === String(data.id))) return sendJson(res, 404, { error: 'Usuário não encontrado' });
      logins = logins.filter(u => String(u.id) !== String(data.id));
      fs.writeFileSync(path.join(DADOS_DIR, 'logins.json'), JSON.stringify(logins, null, 2), 'utf-8');
      sendJson(res, 200, { ok: true });
    });
  },

  // â”€â”€ Configurações Bot (Salas, Setores, etc) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  'GET /api/config/bot': (req, res) => {
    if (!requireAuth(req, res)) return;
    let config = readCollection('bot_config');
    if (!config.salas) config.salas = {};
    if (!config.setores) config.setores = [];
    if (!config.sistemas) config.sistemas = [];
    if (!config.problemas) config.problemas = [];
    if (!config.setores_vita) config.setores_vita = [];
    if (!config.setores_ava) config.setores_ava = [];
    if (!config.salas_vendas) config.salas_vendas = [];
    
    // Converte tudo para um formato uniforme para o frontend: [{ key: "...", value: "..." }]
    const responseData = {};
    for (const cat in config) {
      if (cat === 'journeyOrder') {
        responseData[cat] = config[cat]; // Envia array limpo
        continue;
      }
      responseData[cat] = [];
      if (Array.isArray(config[cat])) {
        config[cat].forEach((val, i) => responseData[cat].push({ key: i, value: val }));
      } else if (typeof config[cat] === 'object' && config[cat] !== null) {
        for (const k in config[cat]) {
          responseData[cat].push({ key: k, value: config[cat][k] });
        }
      }
    }
    sendJson(res, 200, responseData);
  },

  'POST /api/config/bot': (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    const ALLOWED = ['administrador', 'supervisor'];
    if (!ALLOWED.includes(session.role || 'usuario')) return sendJson(res, 403, { error: 'Sem permissão' });
    
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      let data;
      try { data = JSON.parse(body); } catch { return sendJson(res, 400, { error: 'JSON inválido' }); }
      const { category, value, key } = data;
      if (!category || !value) return sendJson(res, 422, { error: 'Categoria e valor são obrigatórios' });
      
      let config = readCollection('bot_config');
      if (!config[category]) config[category] = [];
      
      let items = config[category];
      if (Array.isArray(items)) {
        if (Array.isArray(value)) {
          // Substituição completa (ex: reordenação de journeyOrder)
          config[category] = value;
        } else if (key !== undefined && key !== null && key !== '') {
          const index = Number(key);
          if (index >= 0 && index < items.length) {
            items[index] = value;
          } else {
            return sendJson(res, 404, { error: 'Item não encontrado' });
          }
        } else {
          if (items.includes(value)) return sendJson(res, 409, { error: 'Item já existe' });
          items.push(value);
        }
      } else if (typeof items === 'object' && items !== null) {
        if (key) {
           // Atualiza ou insere chave específica (ex: para templates de menu)
           items[key] = value;
        } else {
           // Comportamento legado: gera chave numérica
           if (Object.values(items).includes(value)) return sendJson(res, 409, { error: 'Item já existe' });
           const maxKey = Math.max(0, ...Object.keys(items).map(Number).filter(n => !isNaN(n)));
           items[String(maxKey + 1)] = value;
        }
      }
      
      fs.writeFileSync(path.join(DADOS_DIR, 'bot_config.json'), JSON.stringify(config, null, 2), 'utf-8');
      sendJson(res, 201, { ok: true });
    });
  },

  'DELETE /api/config/bot': (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    const ALLOWED = ['administrador', 'supervisor'];
    if (!ALLOWED.includes(session.role || 'usuario')) return sendJson(res, 403, { error: 'Sem permissão' });
    
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      let data;
      try { data = JSON.parse(body); } catch { return sendJson(res, 400, { error: 'JSON inválido' }); }
      const { category, key } = data;
      if (!category || key === undefined) return sendJson(res, 422, { error: 'Categoria e key são obrigatórios' });
      
      let config = readCollection('bot_config');
      let items = config[category];
      
      if (Array.isArray(items)) {
        const index = Number(key);
        if (index >= 0 && index < items.length) items.splice(index, 1);
      } else if (typeof items === 'object' && items !== null) {
        if (items[key] !== undefined) delete items[key];
      }
      
      fs.writeFileSync(path.join(DADOS_DIR, 'bot_config.json'), JSON.stringify(config, null, 2), 'utf-8');
      sendJson(res, 200, { ok: true });
    });
  },

  // â”€â”€ Salas (Modal de Novo Chamado no site) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  'GET /api/salas': (req, res) => {
    if (!requireAuth(req, res)) return;
    
    const config = readCollection('bot_config');
    const setoresVita = config.setores_vita || ['Contas a Receber', 'Contas a Pagar', 'Jurídico', 'Controladoria', 'Central de Contratos', 'Estratégico', 'Diretoria / CFO'];
    const setoresAva = config.setores_ava || ['Recursos Humanos', 'Departamento Pessoal'];
    const setoresCanela = config.setores_canela || ['Unique Golden', 'Unique Chateau', 'Unique Stilo Borges', 'Unique Villagio', 'Unique Riserva', 'Unique Sports', 'Retenção'];
    const setoresPedrasAltas = config.setores_pedras_altas || ['Captação', 'Consultoria', 'Operacional', 'Pós Vendas comercial Pedras Altas'];
    const setoresNbaPark = config.setores_nba_park || ['Captação', 'Consultoria', 'Operacional', 'Pós comercial Retenção', 'Pós Vendas comercial NBA'];
    const setoresGoldenGramado = config.setores_golden_gramado || ['Captação', 'Consultoria', 'Operacional', 'Pós Vendas comercial Golden'];

    const locais = [
      ...setoresVita.map(s => 'Vita — ' + s),
      ...setoresAva.map(s => 'AVA — ' + s),
      ...setoresCanela.map(s => 'Canela — ' + s),
      ...setoresPedrasAltas.map(s => 'Sala de Vendas Pedras Altas — ' + s),
      ...setoresNbaPark.map(s => 'Sala de Vendas NBA Park — ' + s),
      ...setoresGoldenGramado.map(s => 'Sala de Vendas Golden Gramado — ' + s)
    ];

    const salas = locais.map((nome, i) => ({ id: i + 1, nome }));
    sendJson(res, 200, { salas });
  },


  // â”€â”€ Configurações â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
        console.log(`[WPP] Status recebido do bot: ${data.status} (Número: ${data.numero || 'N/A'})`);
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
      const config = readCollection('config');
      if (data.numero !== undefined) {
        config.whatsapp = config.whatsapp || {};
        config.whatsapp.numero = String(data.numero).replace(/\D/g, '');
      }
      const configPath = path.join(DADOS_DIR, 'config.json');
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
      sendJson(res, 200, { ok: true, whatsapp: config.whatsapp });
    });
  },

  'GET /api/config': (req, res) => {
    if (!requireAuth(req, res)) return;
    const config = readCollection('config');
    sendJson(res, 200, {
      email_alerta: (config && (config.email_alerta || config.emailAlerta)) || 'ti3@laghettomultipropriedade.com.br',
      whatsapp: (config && config.whatsapp) || { numero: '' }
    });
  },

  'POST /api/config': (req, res) => {
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
      const config = readCollection('config') || {};
      if (data.email_alerta !== undefined) {
        config.email_alerta = String(data.email_alerta).trim();
      }
      if (data.whatsapp !== undefined) {
        config.whatsapp = data.whatsapp;
      }
      const configPath = path.join(DADOS_DIR, 'config.json');
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
      sendJson(res, 200, { ok: true, config });
    });
  },

  'POST /api/upload': (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;

    const url = new URL(req.url, `http://localhost:${PORT}`);
    const originalName = url.searchParams.get('filename') || 'arquivo.bin';
    const ext = path.extname(originalName) || '.bin';
    const filename = `${Date.now()}_${Math.floor(Math.random() * 1000)}${ext}`;
    
    const uploadsDir = path.join(DADOS_DIR, 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const filePath = path.join(uploadsDir, filename);
    const writeStream = fs.createWriteStream(filePath);

    req.pipe(writeStream);

    req.on('end', () => {
      sendJson(res, 201, { filename });
    });

    req.on('error', (err) => {
      console.error('[upload] Erro:', err.message);
      sendJson(res, 500, { error: 'Falha no upload' });
    });
  },
};

// â”€â”€ Server â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

    // Enriquecimento completo igual ao GET /api/tickets
    const contatos = readCollection('contatos');
    const colsData = readCollection('colaboradores');
    let allColaboradores = [];
    const root = Array.isArray(colsData) ? colsData[0] : colsData;
    if (root) {
      allColaboradores = [...(root.lideranca || [])];
      const extractDeep = (sectors) => {
        if (!sectors) return;
        sectors.forEach(s => {
          if (s.colaboradores) allColaboradores.push(...s.colaboradores);
          if (s.subsetores) extractDeep(s.subsetores);
        });
      };
      extractDeep(root.setores);
    }

    let realNumber = null;
    if (ticket.number) {
      const contato = contatos.find(c => String(c.numero).replace(/\D/g, '') === String(ticket.number).replace(/\D/g, ''));
      if (contato) {
        if (contato.nome) ticket = Object.assign({}, ticket, { name: contato.nome });
        if (contato.realNumber) realNumber = contato.realNumber;
      }
    }
    const sNome = ticket.solicitanteNome || ticket.name || ticket.solicitante;
    const sEmail = ticket.solicitanteEmail;

    let colabMatch = findColaboradorMatch(allColaboradores, contatos, { sEmail, sNome, realNumber, number: ticket.number });

    const enriched = Object.assign({}, ticket);
    if (realNumber) enriched.realNumber = realNumber;
    if (colabMatch) {
      enriched.foto = colabMatch.foto;
      enriched.cargo = colabMatch.cargo;
      enriched.colabSetor = colabMatch.setor;
      enriched.solicitanteNome = colabMatch.nome;
    }

    return sendJson(res, 200, enriched);
  }

  // Dynamic route: PATCH /api/tickets/:id
  const patchTicketMatch = /^PATCH \/api\/tickets\/(\d+)$/.exec(routeKey);
  if (patchTicketMatch) {
    const session = getSession(req);
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
      
      let atendenteNome = getAtendenteNome(req, session, (data.atendente && data.atendente !== 'Organograma') ? data.atendente : 'Pedro Sousa');

      let addedMessage = false;
      // Atualiza campos permitidos
      if (data.status)      tickets[idx].status      = data.status;
      if (data.observacao || data.anexo_solucao) {
        addedMessage = true;
        if (data.observacao) tickets[idx].observacao = data.observacao;
        if (data.anexo_solucao) tickets[idx].anexo_solucao = data.anexo_solucao;
        
        if (!tickets[idx].conversa) tickets[idx].conversa = [];
        tickets[idx].conversa.push({
          role: 'technician',
          text: data.observacao || '',
          timestamp: new Date().toISOString(),
          atendente: atendenteNome,
          attachment: data.anexo_solucao || null
        });
      }
      if (data.type)          tickets[idx].type          = data.type;
      if (data.description)   tickets[idx].description   = data.description;
      if (data.sala)          tickets[idx].sala          = data.sala;
      
      tickets[idx].updatedAt = new Date().toISOString();
      
      // Bloqueio simples para evitar race conditions entre site e bot
      const lockPath = path.join(DADOS_DIR, 'tickets.lock');
      let retries = 0;
      while (fs.existsSync(lockPath) && retries < 10) {
        retries++;
        // Espera síncrona curta (aprox 50ms)
        const end = Date.now() + 50;
        while (Date.now() < end) {}
      }
      
      try {
        fs.writeFileSync(lockPath, 'lock', 'utf-8');
        // Re-lê para garantir que não estamos sobrescrevendo mudanças do bot feitas nos últimos milissegundos
        let freshTickets = readCollection('tickets');
        const fIdx = freshTickets.findIndex(t => Number(t.id) === id);
        if (fIdx !== -1) {
          // Mescla as mudanças
          freshTickets[fIdx].status = tickets[idx].status;
          freshTickets[fIdx].observacao = tickets[idx].observacao;
          freshTickets[fIdx].updatedAt = tickets[idx].updatedAt;
          if (tickets[idx].conversa && addedMessage) {
             if (!freshTickets[fIdx].conversa) freshTickets[fIdx].conversa = [];
             // Adiciona apenas a última mensagem do técnico (se houver)
             const lastMsg = tickets[idx].conversa[tickets[idx].conversa.length - 1];
             if (lastMsg && lastMsg.role === 'technician') {
                freshTickets[fIdx].conversa.push(lastMsg);
             }
          }
          fs.writeFileSync(ticketsPath, JSON.stringify(freshTickets, null, 2), 'utf-8');
          tickets = freshTickets;
        }
      } finally {
        if (fs.existsSync(lockPath)) fs.unlinkSync(lockPath);
      }

      const ticket = tickets[idx];
      const WEBHOOK_PORT = process.env.WEBHOOK_PORT || 3000;
      const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';
      const notifPhone = ticket.notifWpp || (ticket.origem === 'bot' ? ticket.number : null);
      const origemNotif = !!notifPhone;

      let emailResult = null;

      if (data.status === 'concluido' && anteriorStatus !== 'concluido' && !notifPhone) {
        const destEmail = ticket.solicitanteEmail || null;
        if (destEmail) {
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
          atendente: atendenteNome,
          observacao: ticket.observacao || '',
          anexo_solucao: ticket.anexo_solucao ? path.join(DADOS_DIR, 'uploads', ticket.anexo_solucao) : null
        });
        const whReq = require('http').request(
          { hostname: 'localhost', port: WEBHOOK_PORT, path: '/webhook/chamado-concluido', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } },
          (whRes) => { whRes.resume(); console.log(`[site] webhook concluido: ${whRes.statusCode}`); }
        );
        whReq.on('error', (e) => console.warn('[site] webhook indisponível:', e.message));
        whReq.write(payload);
        whReq.end();
      } else if (data.observacao !== undefined && !data.status && origemNotif) {
        // Envio de mensagem avulsa / follow-up sem mudar o status
        const payload = JSON.stringify({
          secret:    WEBHOOK_SECRET,
          telefone:  notifPhone,
          id:        ticket.id,
          atendente: atendenteNome,
          observacao: data.observacao,
          anexo_solucao: data.anexo_solucao ? path.join(DADOS_DIR, 'uploads', data.anexo_solucao) : null
        });
        console.log(`[site] Chamando webhook mensagem-avulsa para ${notifPhone}...`);
        const whReq = require('http').request(
          { hostname: 'localhost', port: WEBHOOK_PORT, path: '/webhook/mensagem-avulsa', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } },
          (whRes) => { whRes.resume(); console.log(`[site] Resposta webhook mensagem-avulsa: ${whRes.statusCode}`); }
        );
        whReq.on('error', (e) => console.error('[site] Erro no webhook mensagem-avulsa:', e.message));
        whReq.write(payload);
        whReq.end();
      }

      if (data.status === 'em_atendimento' && anteriorStatus !== 'em_atendimento' && origemNotif) {
        const payload = JSON.stringify({ secret: WEBHOOK_SECRET, telefone: notifPhone, id: ticket.id, tipo: ticket.type, atendente: atendenteNome });
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

  // Serve arquivos estáticos de public/
  const parsedUrl = new URL(req.url, 'http://localhost'); const urlPath = parsedUrl.pathname === '/' ? '/index.html' : parsedUrl.pathname;
  sendFile(res, path.join(PUBLIC_DIR, urlPath));
});

initLogins();

server.listen(PORT, () => {
  console.log(`[site] Rodando em http://localhost:${PORT}`);
});




