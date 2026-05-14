# Resumo do Sistema de Chamados

## 1. Visão Geral
Sistema de suporte técnico integrado ao WhatsApp para abertura e gestão de chamados. Permite que usuários abram chamados via bot de chat e que a equipe técnica gerencie as solicitações através de um painel web centralizado.

## 2. Canal WhatsApp (Bot Interativo)
O bot serve como a principal interface para os usuários solicitantes.
- **Fluxo de Conversa:** Automatizado por estados (Nome -> Categoria -> Descrição).
- **Gestão de Acessos:** Menu específico para sistemas internos (Sienge, GED, Dynamics, etc.) com suporte a multi-seleção.
- **Suporte a Mídia:** Recebimento e armazenamento de imagens/documentos como anexos do chamado.
- **Auto-Consulta:** Comando para listar últimos chamados e seus respectivos status.
- **Sincronização:** Vincula automaticamente o número do WhatsApp aos usuários cadastrados na plataforma web.

## 3. Plataforma Web (Site de Gestão)
Painel administrativo para a equipe de suporte e supervisão.
- **Dashboard:** Visão geral com estatísticas (Abertos, Em Andamento, Concluídos).
- **Gestão de Tickets:**
    - Filtros por canal (Site vs WhatsApp), status e busca textual.
    - Funções de "Assumir" e "Concluir" chamados.
    - Visualização de anexos e histórico do solicitante.
- **Administração:**
    - Gerenciamento de logins e níveis de permissão (Admin, Supervisor, Usuário).
    - Cadastro de salas/locais e tipos de chamado.

## 4. Integrações e Notificações
- **Webhooks:** Comunicação bidirecional entre o Site e o Bot.
- **Notificações em Tempo Real:** O usuário recebe mensagens no WhatsApp quando seu chamado é assumido por um técnico ou concluído.
- **E-mails:** Notificações via SMTP para conclusões de chamados e solicitações estratégicas.

## 5. Arquitetura Técnica
- **Backend:** Node.js (Servidor nativo).
- **Frontend:** HTML5, Tailwind CSS, Lucide Icons.
- **Banco de Dados:** Persistência em arquivos JSON (`dados/*.json`).
- **Comunicação WhatsApp:** WPPConnect / Webhooks.
- **Diretórios de Dados:**
    - `dados/tickets.json`: Base de chamados.
    - `dados/logins.json`: Usuários do sistema.
    - `dados/uploads/`: Arquivos e anexos.
