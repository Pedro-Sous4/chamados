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
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  };
  return map[mime] || null;
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

function getSalasMenu(session = {}) {
  const config = getBotConfig();
  const template = (config.menus || {}).setores || `Olá {nome}! Informe sua sala:\n\n1. Administrativo\n2. Pós-Vendas`;
  return template.replace(/{nome}/g, session.nome || '');
}

function getAjudaTipoMenu(session = {}) {
  const config = getBotConfig();
  const template = (config.menus || {}).demanda || `Como posso ajudar, {nome}?\n\n[1] Sistemas\n[2] Equipamentos`;
  return template.replace(/{nome}/g, session.nome || '');
}

function getSetoresMenu(session = {}) {
  const config = getBotConfig();
  const template = config.menus.setores || `Olá {nome}! Para começar, informe de qual sala ou setor você faz parte:`;
  const text = template.replace(/{nome}/g, session.nome || '');
  
  const setores = config.setores || [];
  if (setores.length === 0) {
    return text;
  }
  return text + `\n\n` + setores.map((s, i) => `${i+1}. ${s}`).join('\n');
}

function getSistemasMenu(session = {}) {
  const config = getBotConfig();
  const template = (config.menus || {}).sistemas || `Escolha o sistema, {nome}:\n\n1. Esolution\n2. Sienge`;
  return template.replace(/{nome}/g, session.nome || '');
}

function getProblemasMenu() {
  const config = getBotConfig();
  const problemas = config.problemas || {};
  return `Qual equipamento está com problema?\n\n` +
         Object.entries(problemas).map(([k, v]) => `${k}. ${v}`).join('\n');
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
    const rawExt = mimeToExt(message.mimetype || '') || 'jpg';
    const filename = `${Date.now()}_${userId.replace(/\D/g, '')}.${rawExt}`;
    const absoluteDadosDir = 'D:\\PROJETOS SISTEMAS\\workspace chamados\\workspace chamados\\dados';
    const filePath = path.join(absoluteDadosDir, 'uploads', filename);

    // 1. REGISTRA NA SESSÃO AGORA (Prioridade Máxima)
    if (!session.anexos) session.anexos = [];
    session.anexos.push(filename);
    console.log(`[BOT] Anexo registrado: ${filename} (Total: ${session.anexos.length})`);

    // 2. SALVA NO DISCO EM SEGUNDO PLANO
    setImmediate(async () => {
      try {
        const mediaData = await client.downloadMedia(message);
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

    if (session.state === 'idle' || session.state === 'aguardando_nome') {
       await send(`Recebi seu anexo. Vou guardá-lo para o chamado.`);
       if (!text) return;
    } else {
       if (!text) return;
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

    if (!text && !temAnexo) return;

    if (!tickets[tIdx].conversa) tickets[tIdx].conversa = [];
    tickets[tIdx].conversa.push({
      role: 'user',
      text: text || '',
      timestamp: new Date().toISOString(),
      attachment: anexoNome || null
    });
    
    tickets[tIdx].updatedAt = new Date().toISOString();
    storage.saveAll('tickets', tickets);
    
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

    if (!text && !temAnexo) {
      await send('Por favor, escreva algo ou envie um anexo.');
      return;
    }

    const tickets = storage.readAll('tickets');
    const idx = tickets.findIndex(t => String(t.id) === String(ticketId));
    
    if (idx >= 0) {
      const dataHora = new Date().toLocaleString('pt-BR');
      const novoComentario = text ? `\n[Cliente ${dataHora}]: ${text}` : '';
      const anexoInfo = anexoNome ? `\n[Anexo enviado em ${dataHora}]` : '';
      
      tickets[idx].description += novoComentario + anexoInfo;
      if (anexoNome) {
        tickets[idx].attachment = anexoNome; 
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
    const newSession = updateSession(userId, { state: 'aguardando_setor', nome: text });
    await send(getSetoresMenu(newSession));
    return;
  }

  // ── ESTADO: aguardando_sala ────────────────────────────────────────────────
  if (session.state === 'aguardando_sala') {
    const config = getBotConfig();
    const salaNome = (config.salas || {})[text];
    if (!salaNome) { await send(`Opção inválida. Escolha o número da sua sala:\n\n${getSalasMenu(session)}`); return; }
    
    if (text === '1') {
      updateSession(userId, { state: 'aguardando_setor', sala: salaNome });
      await send(getSetoresMenu(session));
      return;
    }

    const isSalaVendas = text >= '6'; 
    updateSession(userId, { state: 'aguardando_ajuda_tipo', sala: salaNome, isSalaVendas });
    await send(getAjudaTipoMenu(session));
    return;
  }

  // ── ESTADO: aguardando_setor ───────────────────────────────────────────────
  if (session.state === 'aguardando_setor') {
    const config = getBotConfig();
    const setores = config.setores || [];
    let setorNome;
    if (setores.length === 0) {
      setorNome = text;
    } else {
      setorNome = setores[parseInt(text) - 1];
    }

    if (!setorNome) { 
      await send(`Opção inválida.\n\n${getSetoresMenu(session)}`); 
      return; 
    }

    updateSession(userId, { state: 'aguardando_ajuda_tipo', setor: setorNome });
    await send(getAjudaTipoMenu(session));
    return;
  }

  // ── ESTADO: aguardando_ajuda_tipo ──────────────────────────────────────────
  if (session.state === 'aguardando_ajuda_tipo') {
    const opt = text.toUpperCase().trim();
    
    if (text === '1' || opt === 'A') {
      updateSession(userId, { state: 'aguardando_sistema_especifico', ajuda_tipo: 'Sistemas e Softwares' });
      await send(getSistemasMenu(session));
      return;
    }
    
    if (opt === 'B' || opt === '2') {
      updateSession(userId, { state: 'aguardando_problema_especifico' });
      await send(getProblemasMenu());
      return;
    }

    await send(`Opção inválida. Escolha uma das opções:\n\n${getAjudaTipoMenu(session)}`);
    return;
  }

  // ── ESTADO: aguardando_sistema_especifico ──────────────────────────────────
  if (session.state === 'aguardando_sistema_especifico') {
    if (text.toLowerCase().includes('novo') || text.toLowerCase().includes('inclusão')) {
      updateSession(userId, { state: 'aguardando_inclusao_bloco', sistema: 'Inclusão de Usuário' });
      await send(`Para realizar o *Cadastro de Novo Usuário*, por favor, preencha o formulário abaixo em uma única mensagem:\n\n` +
                 `Nome Completo:\n` +
                 `CPF:\n` +
                 `E-mail:\n` +
                 `Sala:\n` +
                 `Função:`);
      return;
    }
    const config = getBotConfig();
    const sistemas = config.sistemas || [];
    const sistemaNome = sistemas[parseInt(text) - 1];
    if (!sistemaNome) { await send(`Opção inválida.\n\n${getSistemasMenu(session)}`); return; }

    updateSession(userId, { state: 'aguardando_descricao', sistema: sistemaNome, type: `Sistemas - ${sistemaNome}` });
    await send(`Entendido. Por favor, escreva uma *breve descrição* do problema ou solicitação.`);
    return;
  }

  // ── ESTADO: aguardando_inclusao_bloco ──────────────────────────────────────
  if (session.state === 'aguardando_inclusao_bloco') {
    updateSession(userId, { state: 'aguardando_confirmacao', dadosInclusao: text, type: 'Inclusão de Usuário' });
    const resumo = `Confirmando: Suporte para Inclusão de Usuário, Sala ${session.sala}, solicitado por ${session.nome}.\nAnexos enviados: ${session.anexos?.length ? 'Sim' : 'Não'}.\n\nPodemos gerar o chamado? (Responda *SIM* para confirmar)`;
    await send(resumo);
    return;
  }

  // ── ESTADO: aguardando_problema_especifico ───────────────────────────────
  if (session.state === 'aguardando_problema_especifico') {
    const config = getBotConfig();
    const problemas = config.problemas || {};
    const item = problemas[text];
    if (!item) { await send(`Opção inválida.\n\n${getProblemasMenu()}`); return; }
    updateSession(userId, { state: 'aguardando_descricao', item, type: `Problemas - ${item}` });
    await send(`Entendido. Por favor, escreva uma *breve descrição* do problema com o(a) ${item}.`);
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
      await send('Por favor, envie a *FOTO* ou responda *NÃO* para pular.');
      return;
    }

    if (isMedia) {
       console.log(`[bot] anexo adicional recebido.`);
       // A lógica global no topo já salvou o arquivo. 
       // Podemos até perguntar se quer mais, mas para simplificar o fluxo do usuário, vamos avançar.
    }

    updateSession(userId, { state: 'aguardando_confirmacao' });
    
    // Força a leitura do objeto de sessão mais recente para o resumo
    const s = getSession(userId);
    const localizacao = s.setor ? `Setor ${s.setor}` : `Sala ${s.sala}`;
    const temAnexo = (s.anexos && s.anexos.length > 0);

    const resumo = `*Confirmando os dados do Chamado:*\n\n` +
                    `🛠️ *Suporte para:* ${s.sistema || s.item || s.type}\n` +
                   `📍 *Local:* ${localizacao}\n` +
                   `👤 *Solicitante:* ${s.nome}\n` +
                   `📎 *Anexo:* ${temAnexo ? 'Sim' : 'Não'}\n\n` +
                   `Podemos gerar o chamado? (Responda *SIM* para confirmar ou *NÃO* para reiniciar)`;
    await send(resumo);
    return;
  }

  // ── ESTADO: aguardando_confirmacao ─────────────────────────────────────────
  if (session.state === 'aguardando_confirmacao') {
    if (text.toUpperCase() === 'NÃO' || text.toUpperCase() === 'NAO') {
      updateSession(userId, { state: 'aguardando_ajuda_tipo' });
      await send('Entendido. Vamos recomeçar a triagem. O que você deseja solicitar?\n\n[A] Sistemas\n[B] Hardware');
      return;
    }

    if (text.toUpperCase() !== 'SIM') {
      await send('Para confirmar, responda *SIM*. Para corrigir algo, responda *NÃO*.');
      return;
    }

    const descFinal = session.dadosInclusao 
      ? `--- DADOS DE INCLUSÃO ---\n${session.dadosInclusao}` 
      : session.descricao;

    const ticket = storage.insert('tickets', {
      name: session.nome,
      number: extractNumber(userId),
      notifWpp: userId,
      description: descFinal,
      status: 'aberto',
      origem: 'bot',
      solicitante: session.nome,
      type: session.type || 'Suporte',
      sala: session.setor ? `${session.sala} (${session.setor})` : session.sala,
      attachment: (session.anexos && session.anexos.length > 0) ? session.anexos[session.anexos.length - 1] : null
    });

    updateSession(userId, { state: 'chamado_criado' });
    await send(`✅ Gerando chamado...\n\nProtocolo *#${ticket.id}* aberto com sucesso!`);
    return;
  }

  // ── ESTADO: chamado_criado ─────────────────────────────────────────────────
  if (session.state === 'chamado_criado') {
    const nomeAtual = session.nome;
    resetSession(userId);
    updateSession(userId, { state: 'aguardando_sala', nome: nomeAtual });
    await send(getSalasMenu());
    return;
  }
}

module.exports = { handleMessage };
