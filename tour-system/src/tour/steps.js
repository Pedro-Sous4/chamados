// steps.js
// Define os arrays de passos dos tutoriais.
//
// Cada step aceita as seguintes propriedades:
//
//  Propriedades do Joyride:
//   target          {string}  — seletor CSS do elemento a destacar
//   title           {string}  — título do tooltip (opcional)
//   content         {string|ReactNode} — explicação exibida no tooltip
//   placement       {string}  — posição do tooltip: 'auto'|'top'|'bottom'|'left'|'right'|'center'
//   spotlightClicks {boolean} — permite interagir com o elemento enquanto o tooltip está aberto
//   disableBeacon   {boolean} — oculta o beacon pulsante (padrão: true)
//   hideFooter      {boolean} — oculta os botões de navegação
//
//  Propriedades customizadas (ações automáticas):
//   action  {'click'|'type'|'wait'} — ação executada após o usuário clicar em "Próximo"
//   value   {string}                — texto a digitar (apenas action: 'type')
//   delay   {number}                — ms a aguardar  (apenas action: 'wait', padrão: 1000)

// ==========================================================================
// Tutorial de Onboarding principal
// ==========================================================================
export const onboardingSteps = [
  {
    // Passo de boas-vindas: sem target real → renderizado centralizado
    target:    'body',
    placement: 'center',
    title:     '👋 Bem-vindo ao sistema!',
    content:
      'Este breve tutorial vai te guiar pelos principais recursos. ' +
      'Use os botões abaixo para navegar ou clique em "Pular tutorial" se preferir explorar por conta própria.',
  },
  {
    // Demonstra o botão de criação com ação automática de clique
    target:  '.btn-criar',
    title:   'Criar novo item',
    content: 'Clique aqui para abrir o formulário de cadastro de um novo item.',
    action:  'click',               // após "Próximo", clica automaticamente no elemento
  },
  {
    // Campo de texto: digita automaticamente um valor de exemplo
    target:  '.input-nome',
    title:   'Nome do item',
    content: 'Preencha o nome do novo item neste campo. Vamos digitar um exemplo para você.',
    action:  'type',
    value:   'Exemplo de item',     // texto que será digitado automaticamente
  },
  {
    // Botão de salvar com uma pequena pausa para feedback visual
    target:  '.btn-salvar',
    title:   'Salvar',
    content: 'Quando estiver pronto, clique em "Salvar" para confirmar o cadastro.',
    action:  'wait',
    delay:   600,                   // aguarda 600ms antes de avançar
  },
  {
    // Tabela de resultados
    target:    '.tabela-itens',
    placement: 'top',
    title:     'Lista de itens',
    content:
      'Aqui você encontra todos os itens cadastrados. ' +
      'É possível editar, remover ou ordenar cada registro.',
  },
  {
    // Filtros
    target:    '.btn-filtro',
    placement: 'bottom',
    title:     'Filtros',
    content:   'Use os filtros para encontrar itens específicos de forma rápida.',
  },
  {
    // Menu de configurações
    target:    '.menu-configuracoes',
    placement: 'left',
    title:     'Configurações',
    content:   'Acesse preferências, integrações e configurações avançadas do sistema.',
  },
  {
    // Encerramento
    target:    'body',
    placement: 'center',
    title:     '✅ Tudo pronto!',
    content:
      'Você concluiu o tutorial. ' +
      'Caso queira rever alguma funcionalidade, utilize o botão "Ajuda" no menu superior.',
  },
];

// ==========================================================================
// Tutorial de Ajuda (secundário — pode ser iniciado independentemente)
// ==========================================================================
export const helpSteps = [
  {
    target:    'body',
    placement: 'center',
    title:     '💡 Central de Ajuda',
    content:   'Conheça os recursos de suporte disponíveis.',
  },
  {
    target:  '.btn-ajuda',
    title:   'Documentação',
    content: 'Acesse a documentação completa, tutoriais em vídeo e exemplos de uso.',
  },
  {
    target:  '.btn-suporte',
    title:   'Suporte técnico',
    content:
      'Em caso de dúvidas ou problemas, entre em contato com nossa equipe de suporte ' +
      'diretamente por este botão.',
  },
];

// ==========================================================================
// Exemplo de tutorial avançado com todas as ações
// ==========================================================================
export const advancedDemoSteps = [
  {
    target:    'body',
    placement: 'center',
    title:     'Demo de ações automáticas',
    content:   'Este tutorial demonstra as ações click, type e wait.',
  },
  {
    target:  '.btn-criar',
    title:   'Ação: click',
    content: 'Após clicar em Próximo, o botão será clicado automaticamente.',
    action:  'click',
  },
  {
    target:  '.input-nome',
    title:   'Ação: type',
    content: 'O campo será preenchido automaticamente com o texto de exemplo.',
    action:  'type',
    value:   'Texto automático',
  },
  {
    target:  '.btn-salvar',
    title:   'Ação: wait',
    content: 'Aguardamos 1 segundo antes de prosseguir para o próximo passo.',
    action:  'wait',
    delay:   1000,
  },
  {
    target:    '.tabela-itens',
    placement: 'top',
    title:     'Resultado',
    content:   'O item foi salvo e aparece na lista!',
  },
];
