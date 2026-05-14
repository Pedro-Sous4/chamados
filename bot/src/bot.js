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

const MEDIA_TYPES = ['image', 'document', 'video', 'audio'];

function mimeToExt(mime) {
  const map = {
    'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png',
    'image/gif': 'gif', 'image/webp': 'webp',
    'application/pdf': 'pdf',
    'video/mp4': 'mp4', 'video/3gpp': '3gp',
    'audio/ogg': 'ogg', 'audio/mpeg': 'mp3', 'audio/mp4': 'm4a',
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

// ── Menus e Opções ────────────────────────────────────────────────────────────
const SALAS_OPCOES = {
  '1': 'Administrativo (Jurídico, Estratégico, Financeiro, etc)',
  '2': 'Pós-Vendas',
  '3': 'Unique',
  '4': 'Comercial',
  '5': 'Captação',
  '6': 'Sala Pedras Altas',
  '7': 'Sala Pedras Altas Noturno',
  '8': 'Sala NBA',
  '9': 'Sala Golden',
};

const SALAS_MENU = 
  `Olá! Tudo bem? Para começar, informe de qual sala ou setor você faz parte:\n\n` +
  Object.entries(SALAS_OPCOES).map(([k, v]) => `${k}. ${v}`).join('\n');

const AJUDA_TIPO_MENU = 
  `Como posso te ajudar hoje?\n\n` +
  `[A] Sistemas e Softwares (Esolution, Sienge, E-mail, etc.)\n` +
  `[B] Equipamentos e Infraestrutura (Impressora, PC, Totem, Câmeras, Internet)`;

const SETORES_LISTA = [
  'Jurídico', 'Estratégico', 'Central de Contratos', 'Financeiro', 
  'Contas a Receber', 'Departamento Pessoal', 'Recursos Humanos', 'Diretoria'
];
const SETORES_MENU = `Escolha o seu setor administrativo:\n\n` + SETORES_LISTA.map((s, i) => `${i+1}. ${s}`).join('\n');
const SETORES_OPCOES = {};
SETORES_LISTA.forEach((s, i) => { SETORES_OPCOES[String(i+1)] = s; });

const SISTEMAS_LISTA = [
  'Esolution', 'E-mail Corporativo', 'Sienge', 'ASC Brasil', 
  'DocuSign', 'ClickSign', 'GED', 'Dynamics', 'Valley', 
  'Neo Interact', 'CobMais'
];
const SISTEMAS_OPCOES = {};
SISTEMAS_LISTA.forEach((s, i) => { SISTEMAS_OPCOES[String(i+1)] = s; });

const SISTEMAS_MENU = `Escolha o sistema:\n\n` + SISTEMAS_LISTA.map((s, i) => `${i+1}. ${s}`).join('\n') + `\n\nOu descreva "Novo Usuário" para inclusão.`;

const HARDWARE_OPCOES = {
  '1': 'Impressora',
  '2': 'Computador/Notebook',
  '3': 'Totem de Vendas',
  '4': 'Câmeras',
  '5': 'Internet/Wi-Fi',
};

const HARDWARE_MENU = 
  `Qual equipamento está com problema?\n\n` +
  Object.entries(HARDWARE_OPCOES).map(([k, v]) => `${k}. ${v}`).join('\n');

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
       // Se enviou SÓ mídia na etapa de pedir nome, apenas aguarda. Não avança.
       if (!text) return;
    } else {
       // Se for em outra etapa e enviou SÓ mídia, apenas guarda e não avança
       if (!text) return;
    }
  }

  // ── Atalho de Urgência (Regra Adicional) ────────────────────────────────────
  const containsKeyword = KEYWORDS_PROBLEMA.some(k => text.toLowerCase().includes(k));
  if (containsKeyword && session.state === 'idle') {
      updateSession(userId, { state: 'aguardando_nome', urgencia: true });
      await send(`Olá! Identifiquei que você precisa de suporte urgente para um problema técnico.\n\nPara agilizarmos, informe seu *NOME*:`);
      return;
  }

  // ── ESTADO: idle ───────────────────────────────────────────────────────────
  if (session.state === 'idle') {
    // Verifica se o usuário já tem chamados abertos ou em atendimento
    const userNumber = extractNumber(userId);
    const ticketsAbertos = storage.find('tickets', t => 
      t.number === userNumber && 
      (t.status === 'aberto' || t.status === 'em_atendimento')
    );

    if (ticketsAbertos.length > 0) {
      const t = ticketsAbertos[ticketsAbertos.length - 1]; // pega o mais recente
      updateSession(userId, { state: 'aguardando_acao_ticket', targetTicketId: t.id });
      await send(`Olá! Identifiquei que você já possui o chamado *#${t.id}* aberto.\n\n` +
                 `O que você deseja fazer?\n\n` +
                 `[1] Adicionar um comentário / anexo a este chamado\n` +
                 `[2] Abrir um NOVO chamado\n` +
                 `[3] Ver status dos meus chamados`);
      return;
    }

    updateSession(userId, { state: 'aguardando_nome' });
    await send('Olá! Tudo bem? Eu sou o Especialista de Suporte.\n\nPara começar, informe seu *NOME*:');
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
    const userNumber = extractNumber(userId);
    
    // Se enviou mídia, ela já foi registrada na sessão e salva no topo do handleMessage
    const temAnexo = session.anexos && session.anexos.length > 0;
    const anexoNome = temAnexo ? session.anexos[session.anexos.length - 1] : null;

    if (!text && !temAnexo) {
      await send('Por favor, escreva algo ou envie um anexo.');
      return;
    }

    // Atualiza o chamado no banco
    const tickets = storage.readAll('tickets');
    const idx = tickets.findIndex(t => String(t.id) === String(ticketId));
    
    if (idx >= 0) {
      const dataHora = new Date().toLocaleString('pt-BR');
      const novoComentario = text ? `\n[Cliente ${dataHora}]: ${text}` : '';
      
      // Se tiver anexo, registra no histórico também
      const anexoInfo = anexoNome ? `\n[Anexo enviado em ${dataHora}]` : '';
      
      tickets[idx].description += novoComentario + anexoInfo;
      if (anexoNome) {
        // Se o chamado não tinha anexo original, ou se queremos manter o último como principal para o site
        tickets[idx].attachment = anexoNome; 
      }
      tickets[idx].updatedAt = new Date().toISOString();
      
      const fs = require('fs');
      const path = require('path');
      const ticketsPath = path.resolve(__dirname, '..', '..', 'dados', 'tickets.json');
      fs.writeFileSync(ticketsPath, JSON.stringify(tickets, null, 2), 'utf-8');

      await send(`✅ Comentário/Anexo adicionado com sucesso ao chamado *#${ticketId}*!`);
      
      // Notifica o site via webhook (simula o que o site faz quando o técnico comenta)
      // Aqui poderíamos disparar uma atualização para o dashboard via socket se tivéssemos, 
      // mas apenas salvar no JSON já faz o dashboard ver na próxima atualização.
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
       await send('Informe seu *NOME*:');
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
    if (!text) { await send('Por favor, digite o seu nome para continuarmos:'); return; }
    const nome = text; // Garante que o usuário digitou o nome
    updateSession(userId, { state: 'aguardando_sala', nome });
    await send(SALAS_MENU);
    return;
  }

  // ── ESTADO: aguardando_sala ────────────────────────────────────────────────
  if (session.state === 'aguardando_sala') {
    const salaNome = SALAS_OPCOES[text];
    if (!salaNome) { await send(`Opção inválida. Escolha o número da sua sala:\n\n${SALAS_MENU}`); return; }
    
    // Se for Administrativo, pede o setor específico através de menu (Regra Nova)
    if (text === '1') {
      updateSession(userId, { state: 'aguardando_setor', sala: salaNome });
      await send(SETORES_MENU);
      return;
    }

    const isSalaVendas = text >= '6'; 
    const menuDinamico = isSalaVendas 
      ? `Identifiquei que você está em uma Sala de Vendas. Como posso ajudar?\n\n[B] Equipamentos e Hardware (Impressora, Internet, Totem)\n[A] Sistemas e Softwares`
      : AJUDA_TIPO_MENU;

    updateSession(userId, { state: 'aguardando_ajuda_tipo', sala: salaNome, isSalaVendas });
    await send(menuDinamico);
    return;
  }

  // ── ESTADO: aguardando_setor ───────────────────────────────────────────────
  if (session.state === 'aguardando_setor') {
    const setorNome = SETORES_OPCOES[text];
    if (!setorNome) { await send(`Opção inválida.\n\n${SETORES_MENU}`); return; }
    updateSession(userId, { state: 'aguardando_ajuda_tipo', setor: setorNome });
    await send(AJUDA_TIPO_MENU);
    return;
  }

  // ── ESTADO: aguardando_ajuda_tipo ──────────────────────────────────────────
  if (session.state === 'aguardando_ajuda_tipo') {
    const opt = text.toUpperCase();
    if (opt === 'A') {
      updateSession(userId, { state: 'aguardando_sistema_especifico' });
      await send(`Escolha o sistema:\n\n` + SISTEMAS_LISTA.map((s, i) => `${i+1}. ${s}`).join('\n') + `\n\nOu descreva *Novo Usuário* para inclusão.`);
      return;
    }
    if (opt === 'B') {
      updateSession(userId, { state: 'aguardando_hardware_item' });
      await send(HARDWARE_MENU);
      return;
    }
    await send(`Opção inválida. Responda com A ou B.`);
    return;
  }

  // ── ESTADO: aguardando_sistema_especifico ──────────────────────────────────
  if (session.state === 'aguardando_sistema_especifico') {
    if (text.toLowerCase().includes('novo') || text.toLowerCase().includes('inclusão')) {
      updateSession(userId, { state: 'aguardando_inclusao_bloco', sistema: 'Inclusão de Usuário' });
      // Regra 2: Layout de Inclusão Fiel (Bloco Único)
      await send(`Para realizar o *Cadastro de Novo Usuário*, por favor, preencha o formulário abaixo em uma única mensagem:\n\n` +
                 `Nome Completo:\n` +
                 `CPF:\n` +
                 `E-mail:\n` +
                 `Sala:\n` +
                 `Função:`);
      return;
    }
    const sistemaNome = SISTEMAS_OPCOES[text];
    if (!sistemaNome) { await send(`Opção inválida.\n\n${SISTEMAS_MENU}`); return; }

    updateSession(userId, { state: 'aguardando_descricao', sistema: sistemaNome, type: `Sistemas - ${sistemaNome}` });
    await send(`Entendido. Por favor, escreva uma *breve descrição* do problema ou solicitação.`);
    return;
  }

  // ── ESTADO: aguardando_inclusao_bloco ──────────────────────────────────────
  if (session.state === 'aguardando_inclusao_bloco') {
    updateSession(userId, { state: 'aguardando_confirmacao', dadosInclusao: text, type: 'Inclusão de Usuário' });
    
    // Regra 5: Confirmação Final
    const resumo = `Confirmando: Suporte para Inclusão de Usuário, Sala ${session.sala}, solicitado por ${session.nome}.\nAnexos enviados: ${session.anexos?.length ? 'Sim' : 'Não'}.\n\nPodemos gerar o chamado? (Responda *SIM* para confirmar)`;
    await send(resumo);
    return;
  }

  // ── ESTADO: aguardando_hardware_item ───────────────────────────────────────
  if (session.state === 'aguardando_hardware_item') {
    const item = HARDWARE_OPCOES[text];
    if (!item) { await send(`Opção inválida.\n\n${HARDWARE_MENU}`); return; }
    updateSession(userId, { state: 'aguardando_descricao', item, type: `Hardware - ${item}` });
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
                   `🛠️ *Suporte para:* ${s.sistema || s.item}\n` +
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
    await send(SALAS_MENU);
    return;
  }
}

module.exports = { handleMessage };
