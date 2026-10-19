const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const { getSession, updateSession, resetSession } = require('./sessions');
const storage = require('./storage');
const { sendToUser } = require('./context');

const UPLOADS_DIR = path.resolve(__dirname, '..', '..', 'dados', 'uploads');

// ── Configuração de e-mail (espelho do site/server.js) ────────────────────────
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_USER = process.env.SMTP_USER || 'ti3@laghettomultipropriedade.com.br';
const SMTP_PASS = process.env.SMTP_PASS || 'sthamhoashmjlcsg';

const mailerAcesso = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: false,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
  tls: { rejectUnauthorized: false },
});

const MEDIA_TYPES = ['image', 'document', 'video', 'audio', 'ptt'];

function mimeToExt(mime) {
  const map = {
    'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png',
    'image/gif': 'gif', 'image/webp': 'webp',
    'application/pdf': 'pdf',
    'video/mp4': 'mp4', 'video/3gpp': '3gp',
    'audio/ogg': 'ogg', 'audio/mpeg': 'mp3', 'audio/mp4': 'm4a',
    'audio/ogg; codecs=opus': 'ogg',
    'audio/webm': 'webm', 'audio/webm; codecs=opus': 'webm',
    'audio/aac': 'aac', 'audio/wav': 'wav', 'audio/amr': 'amr',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  };
  let ext = map[mime];
  if (!ext && mime) {
    if (mime.startsWith('audio/')) return 'ogg';
    if (mime.startsWith('video/')) return 'mp4';
    if (mime.startsWith('image/')) return 'jpg';
  }
  return ext || null;
}

// ── Proteção 1: ignora mensagens com mais de 2 minutos (replay ao reconectar)
const BOT_START_TIME = Date.now() - 120_000;

// ── Proteção 2: deduplicação por ID estável (string)
const processedIds = new Set();

// ── Proteção 3: lock por usuário — evita processar mensagens concorrentes
const processing = new Set();

// ── Configurações Softcode (Carregadas do bot_config.json) ────────────────────
function getBotConfig() {
  try {
    return storage.readAll('bot_config');
  } catch (err) {
    console.error('[bot:config] erro ao ler bot_config:', err.message);
    return {};
  }
}

function withFooter(text, allowBack = true) {
  let footer = `\n`;
  if (allowBack) footer += `\n*[ V ]* Voltar ao menu anterior`;
  footer += `\n*[ 0 ]* Cancelar atendimento`;
  return text + footer;
}

function getLocalPrincipalMenu(session = {}) {
  const config = getBotConfig();
  const locaisTemplate = (config.menus || {}).locais;
  if (locaisTemplate) {
    return withFooter(locaisTemplate.replace(/{nome}/g, session.nome || ''), true);
  }
  const text = `Olá, {nome}! Qual é a sua sala ou unidade de atuação?\n\n` +
    `1. Vita (Central de Contratos, Contas a Pagar, Contas a Receber, Estratégico, Jurídico, etc...)\n` +
    `2. AVA (DP e RH)\n` +
    `3. Canela (Uniques...)\n` +
    `4. Sala de Vendas Pedras Altas\n` +
    `5. Sala de Vendas NBA Park\n` +
    `6. Sala de Vendas Golden Gramado\n\n` +
    `*(Responda apenas com o NÚMERO)*`;
  return withFooter(text.replace(/{nome}/g, session.nome || ''), true);
}

function getSectoresVita() {
  const config = getBotConfig();
  return config.setores_vita || [
    'Contas a Receber', 'Contas a Pagar', 'Jurídico',
    'Controladoria', 'Central de Contratos', 'Estratégico', 'Diretoria / CFO'
  ];
}
function getSetorVitaMenu() {
  const setores = getSectoresVita();
  const text = `Você está no *Administrativo Vita*. Qual o seu setor?\n\n` + setores.map((s, i) => `${i+1}. ${s}`).join('\n');
  return withFooter(text, true);
}

function getSectoresAva() {
  const config = getBotConfig();
  return config.setores_ava || ['Recursos Humanos', 'Departamento Pessoal'];
}
function getSetorAvaMenu() {
  const setores = getSectoresAva();
  const text = `Você está no *Administrativo AVA*. Qual o seu setor?\n\n` + setores.map((s, i) => `${i+1}. ${s}`).join('\n');
  return withFooter(text, true);
}

function getSectoresCanela() {
  const config = getBotConfig();
  return config.setores_canela || [
    'Unique Golden', 'Unique Chateau', 'Unique Stilo Borges',
    'Unique Villagio', 'Unique Riserva', 'Unique Sports', 'Retenção'
  ];
}
function getSetorCanelaMenu() {
  const setores = getSectoresCanela();
  const text = `Você está no *Administrativo Canela*. Qual o seu setor?\n\n` + setores.map((s, i) => `${i+1}. ${s}`).join('\n');
  return withFooter(text, true);
}

function getSectoresPedrasAltas() {
  const config = getBotConfig();
  return config.setores_pedras_altas || [
    'Captação', 'Consultoria', 'Operacional', 'Pós Vendas comercial Pedras Altas'
  ];
}
function getSetorPedrasAltasMenu() {
  const setores = getSectoresPedrasAltas();
  const text = `Você está na *Sala de Vendas Pedras Altas*. Qual o seu setor?\n\n` + setores.map((s, i) => `${i+1}. ${s}`).join('\n');
  return withFooter(text, true);
}

function getSectoresNbaPark() {
  const config = getBotConfig();
  return config.setores_nba_park || [
    'Captação', 'Consultoria', 'Operacional', 'Pós comercial Retenção', 'Pós Vendas comercial NBA'
  ];
}
function getSetorNbaParkMenu() {
  const setores = getSectoresNbaPark();
  const text = `Você está na *Sala de Vendas NBA Park*. Qual o seu setor?\n\n` + setores.map((s, i) => `${i+1}. ${s}`).join('\n');
  return withFooter(text, true);
}

function getSectoresGoldenGramado() {
  const config = getBotConfig();
  return config.setores_golden_gramado || [
    'Captação', 'Consultoria', 'Operacional', 'Pós Vendas comercial Golden'
  ];
}
function getSetorGoldenGramadoMenu() {
  const setores = getSectoresGoldenGramado();
  const text = `Você está na *Sala de Vendas Golden Gramado*. Qual o seu setor?\n\n` + setores.map((s, i) => `${i+1}. ${s}`).join('\n');
  return withFooter(text, true);
}

function getDemandaTipoMenu() {
  const text = `Como posso te ajudar hoje?\n\n1. Equipamentos e Internet (Impressora, Computador, Wi-Fi, Totem)\n2. Suporte em Sistemas (Erro, dúvida, lentidão)\n3. Criação de Acessos (Novo usuário para sistema)`;
  return withFooter(text, true);
}

function getSistemasMenu(session = {}, isAcesso = false) {
  const config = getBotConfig();
  const sistemas = config.sistemas || [];
  let text = isAcesso 
    ? `Para qual sistema você precisa de *Novo Acesso*?` 
    : `Qual sistema está apresentando problema ou dúvida?`;
  if (sistemas.length > 0) text += `\n\n` + sistemas.map((s, i) => `${i+1}. ${s}`).join('\n');
  return withFooter(text, true);
}

function getEquipamentosMenu() {
  const config = getBotConfig();
  const problemas = config.problemas || {};
  const text = `Qual equipamento ou infraestrutura?\n\n` + Object.entries(problemas).map(([k, v]) => `${k}. ${v}`).join('\n');
  return withFooter(text, true);
}

// ── Envio de e-mail via nodemailer ────────────────────────────────────────────
async function enviarEmailAcesso({ nome, numero, sistema, descricao }) {
  const dataHora = new Date().toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  });

  await mailerAcesso.sendMail({
    from: `"Central de Chamados Laghetto" <${SMTP_USER}>`,
    to: 'estrategico@laghettomultipropriedade.com.br',
    subject: `[Chamado de Acesso] ${sistema} — ${nome}`,
    text:
      `Novo chamado de acesso recebido via WhatsApp.\n\n` +
      `Solicitante : ${nome}\n` +
      `Telefone    : ${numero}\n` +
      `Sistema     : ${sistema}\n` +
      `Data/Hora   : ${dataHora}\n\n` +
      `Descrição:\n${descricao}`,
    html:
      `<p>Novo chamado de acesso recebido via WhatsApp.</p>` +
      `<table>` +
      `<tr><td><b>Solicitante</b></td><td>${nome}</td></tr>` +
      `<tr><td><b>Telefone</b></td><td>${numero}</td></tr>` +
      `<tr><td><b>Sistema</b></td><td>${sistema}</td></tr>` +
      `<tr><td><b>Data/Hora</b></td><td>${dataHora}</td></tr>` +
      `</table>` +
      `<p><b>Descrição:</b><br>${descricao.replace(/\n/g, '<br>')}</p>`,
  });
}

async function enviarAlertaNovoChamado(ticket) {
  try {
    const fs = require('fs');
    const path = require('path');
    let toEmail = 'ti3@laghettomultipropriedade.com.br';
    const configPath = path.resolve(__dirname, '..', '..', 'dados', 'config.json');
    if (fs.existsSync(configPath)) {
      try {
        const cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        if (cfg && (cfg.email_alerta || cfg.emailAlerta)) {
          toEmail = cfg.email_alerta || cfg.emailAlerta;
        }
      } catch {}
    }

    const dataHora = new Date().toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: 'America/Sao_Paulo',
    });

    const ticketId = ticket.id || 'N/A';
    const tipo = ticket.type || 'Suporte';
    const solicitante = ticket.solicitanteNome || ticket.name || ticket.solicitante || 'Não informado';
    const telefone = ticket.realNumber || ticket.number || 'Não informado';
    const salaSetor = ticket.sala || 'Não informado';
    const origemNome = 'WhatsApp Bot';
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

    await mailerAcesso.sendMail({
      from: `"Central de Chamados Laghetto" <${SMTP_USER}>`,
      to: toEmail,
      subject,
      text,
      html,
    });
    console.log(`[bot] Alerta de novo chamado #${ticketId} enviado para ${toEmail}`);
  } catch (err) {
    console.warn(`[bot] Falha ao enviar alerta de novo chamado:`, err.message);
  }
}

const STATUS_LABEL = {
  aberto:           '🟡 Aberto',
  em_atendimento:   '🔵 Em atendimento',
  concluido:        '✅ Concluído',
  cancelado:        '❌ Cancelado',
};

function formatarChamados(tickets) {
  if (tickets.length === 0) {
    return 'Você ainda não possui chamados registrados.';
  }
  const linhas = tickets
    .slice(-5)           // últimos 5
    .reverse()
    .map((t, i) => {
      const status = STATUS_LABEL[t.status] || t.status;
      const data = new Date(t.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
      return `*#${t.id}* — ${t.type}\nStatus: ${status}\nData: ${data}\n📝 ${t.description}`;
    });
  const total = tickets.length;
  const aviso = total > 5 ? `_(exibindo os 5 mais recentes de ${total} chamados)_\n\n` : '';
  return `Seus chamados:\n\n${aviso}${linhas.join('\n\n---\n\n')}`;
}

function extractNumber(from) {
  return from.replace(/@c\.us|@lid/g, '');
}

function getName(message) {
  return message._ns_sender_pushname || message.sender?.pushname || extractNumber(message.from);
}

function getMsgId(message) {
  const id = message.id;
  if (!id) return null;
  if (typeof id === 'string') return id;
  if (typeof id === 'object') return id._serialized || JSON.stringify(id);
  return String(id);
}

async function handleMessage(client, message) {
  const userId = message.from;

  // Proteção 1 — ignora mensagens antigas (replay ao reconectar)
  const msgTimestamp = (message.timestamp || 0) * 1000;
  if (msgTimestamp && msgTimestamp < BOT_START_TIME) {
    console.log(`[ignorada] mensagem antiga de ${extractNumber(userId)}`);
    return;
  }

  // Proteção 2 — ignora ID já processado
  const msgId = getMsgId(message);
  if (msgId) {
    if (processedIds.has(msgId)) {
      console.log(`[ignorada] duplicata id=${msgId}`);
      return;
    }
    processedIds.add(msgId);
    if (processedIds.size > 1000) {
      processedIds.delete(processedIds.values().next().value);
    }
  }

  try {
    await processState(client, message, userId);
  } catch (err) {
    console.error(`[erro] ao processar mensagem de ${extractNumber(userId)}:`, err.message || err);
  }
}

// ── Palavras-chave de Urgência ──────────────────────────────────────────────
const KEYWORDS_PROBLEMA = ['impressora', 'parou', 'erro', 'problema', 'defeito', 'não funciona', 'parado', 'quebrou'];

async function processState(client, message, userId) {
  const text = (message.body || '').replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '').trim();
  const session = getSession(userId);
  console.log(`[bot] Mensagem de ${userId} (Push: ${getName(message)}) | Estado: ${session.state} | Texto: "${text}"`);

  async function send(msg) {
    try { await sendToUser(userId, msg); } catch (err) {
      console.error(`[bot:send] erro ao enviar para ${userId}:`, err.message);
    }
  }

  // ── Diagnóstico e Captura de Anexos ────────────────────────────────────────
  const isMedia = message.isMedia || MEDIA_TYPES.includes(message.type) || !!message.mimetype;
  
  if (isMedia) {
    const mediaItems = message.mediaBatch || [message];
    if (!session.anexos) session.anexos = [];
    const absoluteDadosDir = path.resolve(__dirname, '..', '..', 'dados');

    for (let i = 0; i < mediaItems.length; i++) {
      const item = mediaItems[i];
      const rawExt = mimeToExt(item.mimetype || '') || 'jpg';
      const filename = `${Date.now()}_${Math.floor(Math.random() * 1000)}_${userId.replace(/\D/g, '')}.${rawExt}`;
      const filePath = path.join(absoluteDadosDir, 'uploads', filename);

      // 1. REGISTRA NA SESSÃO AGORA (Prioridade Máxima)
      session.anexos.push(filename);
      console.log(`[BOT] Anexo registrado: ${filename} (Total: ${session.anexos.length})`);

      // 2. SALVA NO DISCO EM SEGUNDO PLANO
      setImmediate(async () => {
        try {
          const msgId = getMsgId(item) || item;
          const mediaData = await client.downloadMedia(msgId);
          if (mediaData) {
            const base64Data = typeof mediaData === 'string' ? mediaData.replace(/^data:.*?base64,/, '') : mediaData;
            const buffer = Buffer.isBuffer(base64Data) ? base64Data : Buffer.from(base64Data, 'base64');
            fs.writeFileSync(filePath, buffer);
            console.log(`[DISK] Arquivo salvo: ${filename}`);
          }
        } catch (err) {
          console.error(`[DISK ERROR]`, err);
        }
      });
    }

    if (session.state === 'idle' || session.state === 'aguardando_nome') {
       const qtd = mediaItems.length;
       if (qtd > 1) {
         await send(`Recebi seus ${qtd} anexos. Vou guardá-los para o chamado.`);
       } else {
         await send(`Recebi seu anexo. Vou guardá-lo para o chamado.`);
       }
       if (!text) return;
    } else {
       if (session.state !== 'em_atendimento' && session.state !== 'aguardando_comentario') {
          if (!text) return;
       }
    }
  }

  // ── Atalho de Urgência (Regra Adicional) ────────────────────────────────────
  const containsKeyword = KEYWORDS_PROBLEMA.some(k => text.toLowerCase().includes(k));
  if (containsKeyword && session.state === 'idle') {
      updateSession(userId, { state: 'aguardando_nome', urgencia: true });
      const config = getBotConfig();
      const msg = (config.menus || {}).saudacao || `Olá! Identifiquei que você precisa de suporte urgente.\n\nPara agilizarmos, informe seu *NOME*:`;
      await send(msg);
      return;
  }

  // ── Interceptador Global: Cancelar / Voltar ─────────────────────────────────
  const opt = text.toUpperCase().trim();
  
  if ((opt === '0' || opt === 'CANCELAR') && session.state !== 'idle' && session.state !== 'em_atendimento') {
    resetSession(userId);
    await send('Atendimento cancelado. Se precisar de algo, é só me chamar novamente!');
    return;
  }

  if ((opt === 'V' || opt === 'VOLTAR') && session.state !== 'idle' && session.state !== 'em_atendimento') {
     if (session.state === 'aguardando_local_principal') {
        updateSession(userId, { state: 'aguardando_nome' });
        const config = getBotConfig();
        const msg = (config.menus || {}).saudacao || 'Olá! Tudo bem? Eu sou o Especialista de Suporte.\n\nPara começar, informe seu *NOME*:';
        await send(msg);
        return;
     }
     if (session.state === 'aguardando_setor_vita' || session.state === 'aguardando_setor_ava' || 
         session.state === 'aguardando_setor_canela' || session.state === 'aguardando_setor_pedras_altas' || 
         session.state === 'aguardando_setor_nba_park' || session.state === 'aguardando_setor_golden_gramado') {
        updateSession(userId, { state: 'aguardando_local_principal' });
        await send(getLocalPrincipalMenu(session));
        return;
     }
     if (session.state === 'aguardando_demanda_tipo') {
        if (session.local_type === 'VITA') {
           updateSession(userId, { state: 'aguardando_setor_vita' });
           await send(getSetorVitaMenu());
        } else if (session.local_type === 'AVA') {
           updateSession(userId, { state: 'aguardando_setor_ava' });
           await send(getSetorAvaMenu());
        } else if (session.local_type === 'CANELA') {
           updateSession(userId, { state: 'aguardando_setor_canela' });
           await send(getSetorCanelaMenu());
        } else if (session.local_type === 'PEDRAS_ALTAS') {
           updateSession(userId, { state: 'aguardando_setor_pedras_altas' });
           await send(getSetorPedrasAltasMenu());
        } else if (session.local_type === 'NBA_PARK') {
           updateSession(userId, { state: 'aguardando_setor_nba_park' });
           await send(getSetorNbaParkMenu());
        } else if (session.local_type === 'GOLDEN_GRAMADO') {
           updateSession(userId, { state: 'aguardando_setor_golden_gramado' });
           await send(getSetorGoldenGramadoMenu());
        } else {
           updateSession(userId, { state: 'aguardando_local_principal' });
           await send(getLocalPrincipalMenu(session));
        }
        return;
     }
     if (session.state === 'aguardando_sistema' || session.state === 'aguardando_equipamento' || session.state === 'aguardando_sistema_acesso') {
        updateSession(userId, { state: 'aguardando_demanda_tipo' });
        await send(getDemandaTipoMenu());
        return;
     }
     if (session.state === 'aguardando_dados_acesso' || session.state === 'aguardando_descricao') {
        if (session.isAcesso) {
           updateSession(userId, { state: 'aguardando_sistema_acesso' });
           await send(getSistemasMenu(session, true));
        } else if (session.sistema) {
           updateSession(userId, { state: 'aguardando_sistema' });
           await send(getSistemasMenu(session, false));
        } else {
           updateSession(userId, { state: 'aguardando_equipamento' });
           await send(getEquipamentosMenu());
        }
        return;
     }
     if (session.state === 'aguardando_anexo') {
        if (session.isAcesso) {
           updateSession(userId, { state: 'aguardando_dados_acesso' });
           await send(`Por favor, preencha novamente os dados do colaborador.`);
        } else {
           updateSession(userId, { state: 'aguardando_descricao' });
           await send(`Por favor, reescreva uma *breve descrição* do problema.`);
        }
        return;
     }
     if (session.state === 'aguardando_confirmacao') {
        updateSession(userId, { state: 'aguardando_anexo' });
        await send(`Deseja enviar alguma *FOTO ou ANEXO*? Se sim, envie agora. Se não tiver, responda *NÃO* para pular.`);
        return;
     }
  }

  // ── ESTADO: idle ───────────────────────────────────────────────────────────
  if (session.state === 'idle') {
    const userNumber = extractNumber(userId);
    const ticketsAbertos = storage.find('tickets', t => 
      t.number === userNumber && 
      (t.status === 'aberto' || t.status === 'em_atendimento')
    );

    if (ticketsAbertos.length > 0) {
      const t = ticketsAbertos[ticketsAbertos.length - 1]; 
      
      if (t.status === 'em_atendimento') {
        updateSession(userId, { state: 'em_atendimento', targetTicketId: t.id });
        return await processState(client, message, userId);
      }

      updateSession(userId, { state: 'aguardando_acao_ticket', targetTicketId: t.id });
      await send(`Olá! Identifiquei que você já possui o chamado *#${t.id}* aberto.\n\n` +
                 `O que você deseja fazer?\n\n` +
                 `[1] Adicionar um comentário / anexo a este chamado\n` +
                 `[2] Abrir um NOVO chamado\n` +
                 `[3] Ver status dos meus chamados`);
      return;
    }

    updateSession(userId, { state: 'aguardando_nome' });
    const config = getBotConfig();
    const msg = (config.menus || {}).saudacao || 'Olá! Tudo bem? Eu sou o Especialista de Suporte.\n\nPara começar, informe seu *NOME*:';
    await send(msg);
    return;
  }

  // ── ESTADO: em_atendimento (MODO CHAT DIRETO) ───────────────────────────────
  if (session.state === 'em_atendimento') {
    const ticketId = session.targetTicketId;
    
    const tickets = storage.readAll('tickets');
    const tIdx = tickets.findIndex(t => String(t.id) === String(ticketId));
    
    if (tIdx === -1 || (tickets[tIdx].status !== 'em_atendimento' && tickets[tIdx].status !== 'aberto')) {
      resetSession(userId);
      return await processState(client, message, userId);
    }

    const temAnexo = session.anexos && session.anexos.length > 0;
    const anexoNome = temAnexo ? session.anexos[session.anexos.length - 1] : null;
    const anexosList = temAnexo ? [...session.anexos] : [];

    if (!text && !temAnexo) return;

    if (!tickets[tIdx].conversa) tickets[tIdx].conversa = [];
    tickets[tIdx].conversa.push({
      role: 'user',
      text: text || '',
      timestamp: new Date().toISOString(),
      attachment: anexoNome || null,
      attachments: anexosList
    });
    
    tickets[tIdx].updatedAt = new Date().toISOString();
    storage.saveAll('tickets', tickets);
    
    // Limpa anexos da sessão após salvar para evitar duplicação em envios seguintes
    if (temAnexo) {
      session.anexos = [];
      updateSession(userId, session);
    }
    
    console.log(`[CHAT] Mensagem de ${userId} anexada ao chamado #${ticketId}`);
    return;
  }

  // ── ESTADO: aguardando_acao_ticket ─────────────────────────────────────────
  if (session.state === 'aguardando_acao_ticket') {
    if (text === '1') {
      updateSession(userId, { state: 'aguardando_comentario' });
      await send(`Certo. Por favor, escreva o seu *comentário* ou envie um *anexo* (foto/arquivo) para o chamado *#${session.targetTicketId}*:`);
      return;
    }
    if (text === '2') {
      updateSession(userId, { state: 'aguardando_nome' });
      await send('Entendido. Vamos abrir um novo chamado.\n\nPara começar, informe seu *NOME*:');
      return;
    }
    if (text === '3' || text.toLowerCase().includes('status')) {
      const userNumber = extractNumber(userId);
      const tickets = storage.find('tickets', t => t.number === userNumber);
      await send(formatarChamados(tickets));
      await send(`O que mais deseja fazer?\n\n[1] Comentar no chamado #${session.targetTicketId}\n[2] Abrir novo chamado\n[0] Encerrar`);
      return;
    }
    if (text === '0') {
      resetSession(userId);
      await send('Atendimento encerrado. Se precisar de algo, é só chamar!');
      return;
    }
    await send('Opção inválida. Escolha [1], [2], [3] ou [0] para encerrar.');
    return;
  }

  // ── ESTADO: aguardando_comentario ──────────────────────────────────────────
  if (session.state === 'aguardando_comentario') {
    const ticketId = session.targetTicketId;
    const temAnexo = session.anexos && session.anexos.length > 0;
    const anexoNome = temAnexo ? session.anexos[session.anexos.length - 1] : null;
    const anexosList = temAnexo ? [...session.anexos] : [];

    if (!text && !temAnexo) {
      await send('Por favor, escreva algo ou envie um anexo.');
      return;
    }

    const tickets = storage.readAll('tickets');
    const idx = tickets.findIndex(t => String(t.id) === String(ticketId));
    
    if (idx >= 0) {
      const dataHora = new Date().toLocaleString('pt-BR');
      const novoComentario = text ? `\n[Cliente ${dataHora}]: ${text}` : '';
      const anexoInfo = temAnexo ? `\n[Anexo(s) enviado(s) em ${dataHora}]` : '';
      
      tickets[idx].description += novoComentario + anexoInfo;
      if (anexoNome) {
        tickets[idx].attachment = anexoNome;
        if (!tickets[idx].attachments) tickets[idx].attachments = [];
        tickets[idx].attachments.push(...anexosList);
      }
      tickets[idx].updatedAt = new Date().toISOString();
      
      const fs = require('fs');
      const path = require('path');
      const ticketsPath = path.resolve(__dirname, '..', '..', 'dados', 'tickets.json');
      fs.writeFileSync(ticketsPath, JSON.stringify(tickets, null, 2), 'utf-8');

      await send(`✅ Comentário/Anexo adicionado com sucesso ao chamado *#${ticketId}*!`);
    } else {
      await send(`Erro: Chamado #${ticketId} não encontrado.`);
    }

    resetSession(userId);
    await send(`Deseja algo mais?\n\n[1] Abrir novo chamado\n[2] Ver status\n[0] Sair`);
    updateSession(userId, { state: 'pos_comentario' });
    return;
  }

  if (session.state === 'pos_comentario') {
    if (text === '1') {
       updateSession(userId, { state: 'aguardando_nome' });
       const config = getBotConfig();
       const msg = (config.menus || {}).saudacao || 'Informe seu *NOME*:';
       await send(msg);
    } else if (text === '2') {
       const userNumber = extractNumber(userId);
       const tickets = storage.find('tickets', t => t.number === userNumber);
       await send(formatarChamados(tickets));
       await send(`[1] Abrir novo chamado\n[0] Sair`);
    } else {
       resetSession(userId);
       await send('Atendimento encerrado.');
    }
    return;
  }

  // ── ESTADO: aguardando_nome ────────────────────────────────────────────────
  if (session.state === 'aguardando_nome') {
    const newSession = { ...session, state: 'aguardando_local_principal', nome: text };
    updateSession(userId, newSession);
    await send(getLocalPrincipalMenu(newSession));
    return;
  }

  // ── ESTADO: aguardando_local_principal ─────────────────────────────────────
  if (session.state === 'aguardando_local_principal') {
    if (text === '1') {
      updateSession(userId, { state: 'aguardando_setor_vita', local_type: 'VITA' });
      await send(getSetorVitaMenu());
      return;
    }
    if (text === '2') {
      updateSession(userId, { state: 'aguardando_setor_ava', local_type: 'AVA' });
      await send(getSetorAvaMenu());
      return;
    }
    if (text === '3') {
      updateSession(userId, { state: 'aguardando_setor_canela', local_type: 'CANELA' });
      await send(getSetorCanelaMenu());
      return;
    }
    if (text === '4') {
      updateSession(userId, { state: 'aguardando_setor_pedras_altas', local_type: 'PEDRAS_ALTAS' });
      await send(getSetorPedrasAltasMenu());
      return;
    }
    if (text === '5') {
      updateSession(userId, { state: 'aguardando_setor_nba_park', local_type: 'NBA_PARK' });
      await send(getSetorNbaParkMenu());
      return;
    }
    if (text === '6') {
      updateSession(userId, { state: 'aguardando_setor_golden_gramado', local_type: 'GOLDEN_GRAMADO' });
      await send(getSetorGoldenGramadoMenu());
      return;
    }
    await send(`Opção inválida.\n\n${getLocalPrincipalMenu(session)}`);
    return;
  }

  // ── ESTADO: aguardando_setor_vita ──────────────────────────────────────────
  if (session.state === 'aguardando_setor_vita') {
    const setores = getSectoresVita();
    const sName = setores[parseInt(text) - 1];
    if (!sName) { await send(`Opção inválida.\n\n${getSetorVitaMenu()}`); return; }
    updateSession(userId, { state: 'aguardando_demanda_tipo', local: `Administrativo Vita - ${sName}` });
    await send(getDemandaTipoMenu());
    return;
  }

  // ── ESTADO: aguardando_setor_ava ───────────────────────────────────────────
  if (session.state === 'aguardando_setor_ava') {
    const setores = getSectoresAva();
    const sName = setores[parseInt(text) - 1];
    if (!sName) { await send(`Opção inválida.\n\n${getSetorAvaMenu()}`); return; }
    updateSession(userId, { state: 'aguardando_demanda_tipo', local: `Administrativo AVA - ${sName}` });
    await send(getDemandaTipoMenu());
    return;
  }

  // ── ESTADO: aguardando_setor_canela ────────────────────────────────────────
  if (session.state === 'aguardando_setor_canela') {
    const setores = getSectoresCanela();
    const sName = setores[parseInt(text) - 1];
    if (!sName) { await send(`Opção inválida.\n\n${getSetorCanelaMenu()}`); return; }
    updateSession(userId, { state: 'aguardando_demanda_tipo', local: `Administrativo Canela - ${sName}` });
    await send(getDemandaTipoMenu());
    return;
  }

  // ── ESTADO: aguardando_setor_pedras_altas ──────────────────────────────────
  if (session.state === 'aguardando_setor_pedras_altas') {
    const setores = getSectoresPedrasAltas();
    const sName = setores[parseInt(text) - 1];
    if (!sName) { await send(`Opção inválida.\n\n${getSetorPedrasAltasMenu()}`); return; }
    updateSession(userId, { state: 'aguardando_demanda_tipo', local: `Sala de Vendas Pedras Altas - ${sName}` });
    await send(getDemandaTipoMenu());
    return;
  }

  // ── ESTADO: aguardando_setor_nba_park ──────────────────────────────────────
  if (session.state === 'aguardando_setor_nba_park') {
    const setores = getSectoresNbaPark();
    const sName = setores[parseInt(text) - 1];
    if (!sName) { await send(`Opção inválida.\n\n${getSetorNbaParkMenu()}`); return; }
    updateSession(userId, { state: 'aguardando_demanda_tipo', local: `Sala de Vendas NBA Park - ${sName}` });
    await send(getDemandaTipoMenu());
    return;
  }

  // ── ESTADO: aguardando_setor_golden_gramado ────────────────────────────────
  if (session.state === 'aguardando_setor_golden_gramado') {
    const setores = getSectoresGoldenGramado();
    const sName = setores[parseInt(text) - 1];
    if (!sName) { await send(`Opção inválida.\n\n${getSetorGoldenGramadoMenu()}`); return; }
    updateSession(userId, { state: 'aguardando_demanda_tipo', local: `Sala de Vendas Golden Gramado - ${sName}` });
    await send(getDemandaTipoMenu());
    return;
  }

  // ── ESTADO: aguardando_demanda_tipo ────────────────────────────────────────
  if (session.state === 'aguardando_demanda_tipo') {
    if (text === '1') {
      updateSession(userId, { state: 'aguardando_equipamento', type: 'Equipamento/Infra' });
      await send(getEquipamentosMenu());
      return;
    }
    if (text === '2') {
      updateSession(userId, { state: 'aguardando_sistema', type: 'Sistemas', isAcesso: false });
      await send(getSistemasMenu(session, false));
      return;
    }
    if (text === '3') {
      updateSession(userId, { state: 'aguardando_sistema_acesso', type: 'Acesso', isAcesso: true });
      await send(getSistemasMenu(session, true));
      return;
    }
    await send(`Opção inválida.\n\n${getDemandaTipoMenu()}`);
    return;
  }

  // ── ESTADO: aguardando_equipamento ─────────────────────────────────────────
  if (session.state === 'aguardando_equipamento') {
    const config = getBotConfig();
    const problemas = config.problemas || {};
    const item = problemas[text];
    if (!item) { await send(`Opção inválida.\n\n${getEquipamentosMenu()}`); return; }
    updateSession(userId, { state: 'aguardando_descricao', item, type: `Equipamento - ${item}` });
    await send(`Entendido. Por favor, escreva uma *breve descrição* do problema com: ${item}.`);
    return;
  }

  // ── ESTADO: aguardando_sistema ─────────────────────────────────────────────
  if (session.state === 'aguardando_sistema') {
    const config = getBotConfig();
    const sistemas = config.sistemas || [];
    const item = sistemas[parseInt(text) - 1];
    if (!item) { await send(`Opção inválida.\n\n${getSistemasMenu(session, false)}`); return; }
    updateSession(userId, { state: 'aguardando_descricao', sistema: item, type: `Sistema - ${item}` });
    await send(`Entendido. Por favor, escreva uma *breve descrição* do problema ou dúvida no ${item}.`);
    return;
  }

  // ── ESTADO: aguardando_sistema_acesso ──────────────────────────────────────
  if (session.state === 'aguardando_sistema_acesso') {
    const config = getBotConfig();
    const sistemas = config.sistemas || [];
    const item = sistemas[parseInt(text) - 1];
    if (!item) { await send(`Opção inválida.\n\n${getSistemasMenu(session, true)}`); return; }
    updateSession(userId, { state: 'aguardando_dados_acesso', sistema: item, type: `Criação de Acesso - ${item}` });
    await send(`Certo, vamos criar o acesso para o sistema *${item}*.\n\nResponda em uma *única mensagem* os dados do colaborador:\n\n- Nome Completo:\n- CPF:\n- E-mail:\n- Função:`);
    return;
  }

  // ── ESTADO: aguardando_dados_acesso ────────────────────────────────────────
  if (session.state === 'aguardando_dados_acesso') {
    updateSession(userId, { state: 'aguardando_anexo', descricao: text || '(Sem dados informados)' });
    await send(`Perfeito. Se houver alguma aprovação do gestor ou formulário necessário, envie o *ANEXO/FOTO* agora. Se não tiver, responda *NÃO* para pular.`);
    return;
  }

  // ── ESTADO: aguardando_descricao ───────────────────────────────────────────
  if (session.state === 'aguardando_descricao') {
    const isBase64 = text.length > 200 && (text.includes('/9j/') || text.startsWith('data:'));
    if (isBase64 || (!text && !isMedia)) {
      return;
    }
    
    // Se enviou mídia com legenda, salva a legenda como descrição e processa a mídia
    updateSession(userId, { state: 'aguardando_anexo', descricao: text || '(Sem descrição detalhada)' });
    
    if (isMedia) {
      await send(`Recebi sua foto e a descrição. Deseja enviar mais alguma *FOTO* ou podemos prosseguir? Se não tiver mais nada, responda *NÃO*.`);
    } else {
      await send(`Perfeito. Para finalizar, você tem alguma *FOTO ou PRINT* do erro? Se sim, envie agora. Se não tiver, responda *NÃO* para pular.`);
    }
    return;
  }

  // ── ESTADO: aguardando_anexo ───────────────────────────────────────────────
  if (session.state === 'aguardando_anexo') {
    const skip = text.toUpperCase() === 'NÃO' || text.toUpperCase() === 'NAO';
    
    if (!skip && !isMedia) {
      await send('Por favor, envie a *FOTO/ANEXO* ou responda *NÃO* para pular.');
      return;
    }

    if (isMedia) {
       console.log(`[bot] anexo adicional recebido.`);
    }

    updateSession(userId, { state: 'aguardando_confirmacao' });
    
    const s = getSession(userId);
    const localizacao = s.local || 'Local não especificado';
    const temAnexo = (s.anexos && s.anexos.length > 0);
    const qtdAnexos = temAnexo ? s.anexos.length : 0;
    const anexoLabel = temAnexo ? `Sim (${qtdAnexos} arquivo${qtdAnexos > 1 ? 's' : ''})` : 'Não';

    const resumo = `*Confirmando os dados do Chamado:*\n\n` +
                   `🛠️ *Suporte para:* ${s.type || s.sistema || s.item}\n` +
                   `📍 *Local:* ${localizacao}\n` +
                   `👤 *Solicitante:* ${s.nome}\n` +
                   `📎 *Anexo:* ${anexoLabel}\n\n` +
                   `Podemos gerar o chamado? (Responda *SIM* para confirmar ou *NÃO* para reiniciar)`;
    await send(resumo);
    return;
  }

  // ── ESTADO: aguardando_confirmacao ─────────────────────────────────────────
  if (session.state === 'aguardando_confirmacao') {
    if (text.toUpperCase() === 'NÃO' || text.toUpperCase() === 'NAO') {
      updateSession(userId, { state: 'aguardando_demanda_tipo' });
      await send('Entendido. Vamos recomeçar a triagem.\n\n' + getDemandaTipoMenu());
      return;
    }

    if (text.toUpperCase() !== 'SIM') {
      await send('Para confirmar, responda *SIM*. Para corrigir algo, responda *NÃO*.');
      return;
    }

    const descFinal = session.descricao || '';

    const ticket = storage.insert('tickets', {
      name: session.nome,
      number: extractNumber(userId),
      notifWpp: userId,
      description: descFinal,
      status: 'aberto',
      origem: 'bot',
      solicitante: session.nome,
      type: session.type || 'Suporte',
      sala: session.local || 'Não informado',
      attachment: (session.anexos && session.anexos.length > 0) ? session.anexos[session.anexos.length - 1] : null,
      attachments: (session.anexos && session.anexos.length > 0) ? [...session.anexos] : []
    });

    // Garante o cadastro do contato
    try {
      const contatos = storage.readAll('contatos');
      const normalizedNum = extractNumber(userId);
      const exists = contatos.some(c => String(c.numero).replace(/\D/g, '') === normalizedNum);
      if (!exists) {
        contatos.push({
          id: Date.now(),
          createdAt: new Date().toISOString(),
          numero: normalizedNum,
          nome: session.nome
        });
        const fs = require('fs');
        const path = require('path');
        const contatosPath = path.resolve(__dirname, '..', '..', 'dados', 'contatos.json');
        fs.writeFileSync(contatosPath, JSON.stringify(contatos, null, 2), 'utf-8');
      }
    } catch (err) {
      console.error('[bot] erro ao salvar contato:', err.message);
    }

    // Dispara alerta de novo chamado por e-mail para o TI
    enviarAlertaNovoChamado(ticket).catch(err => console.warn('[bot] erro ao disparar alerta de novo chamado:', err.message));

    updateSession(userId, { state: 'chamado_criado' });
    await send(`✅ Gerando chamado...\n\nProtocolo *#${ticket.id}* aberto com sucesso!`);
    return;
  }

  // ── ESTADO: chamado_criado ─────────────────────────────────────────────────
  if (session.state === 'chamado_criado') {
    const nomeAtual = session.nome;
    resetSession(userId);
    updateSession(userId, { state: 'aguardando_local_principal', nome: nomeAtual });
    await send(getLocalPrincipalMenu({ nome: nomeAtual }));
    return;
  }
}

module.exports = { handleMessage };
