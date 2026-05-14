// App.jsx
// Exemplo completo de uso do sistema de tour.
//
// Estrutura:
//   <TourProvider> envolve toda a aplicação e expõe o contexto.
//   <AppContent>  consome useTour() e renderiza a UI de demonstração.
//
// Para integrar em uma aplicação existente:
//   1. Envolva o <App> (ou o root do projeto) com <TourProvider>
//   2. Use useTour() em qualquer componente filho para iniciar/controlar tutoriais
//   3. Defina seus steps em steps.js e passe para startTour()

import React, { useEffect } from 'react';
import TourProvider from './tour/TourProvider';
import useTour from './tour/useTour';
import { onboardingSteps, helpSteps, advancedDemoSteps } from './tour/steps';

// ==========================================================================
// Componente interno que consome o contexto do tour
// ==========================================================================
const AppContent = () => {
  const {
    startTour,
    resetTour,
    hasSeen,
    isRunning,
    pauseTour,
    resumeTour,
    stepIndex,
    activeTour,
  } = useTour();

  // Inicia o onboarding automaticamente na primeira visita.
  // O próprio startTour verifica o localStorage e ignora se já foi visto.
  useEffect(() => {
    // Pequeno delay para garantir que o DOM esteja completamente renderizado
    const id = setTimeout(() => {
      startTour('onboarding', onboardingSteps);
    }, 400);
    return () => clearTimeout(id);
  }, []); // intencional: só executa na montagem

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.logo}>Minha Aplicação</h1>
        <nav style={styles.nav}>
          <button className="btn-ajuda"         style={btnStyle('#2e7d32')}>? Ajuda</button>
          <button className="btn-suporte"        style={btnStyle('#7b1fa2')}>Suporte</button>
          <button className="menu-configuracoes" style={btnStyle('#455a64')}>⚙ Config</button>
        </nav>
      </header>

      <main style={styles.main}>
        {/* ---------------------------------------------------------------- */}
        {/* Área de ações principais                                         */}
        {/* ---------------------------------------------------------------- */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Itens</h2>

          <div style={styles.toolbar}>
            <button className="btn-criar"  style={btnStyle('#0066cc')}>+ Criar novo item</button>
            <button className="btn-filtro" style={btnStyle('#546e7a')}>⚙ Filtros</button>
          </div>

          {/* Formulário inline de exemplo */}
          <div style={styles.form}>
            <input
              className="input-nome"
              placeholder="Nome do item"
              style={styles.input}
            />
            <input
              className="input-descricao"
              placeholder="Descrição (opcional)"
              style={styles.input}
            />
            <button className="btn-salvar" style={btnStyle('#2e7d32')}>✓ Salvar</button>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Tabela de itens                                                  */}
        {/* ---------------------------------------------------------------- */}
        <section style={styles.section}>
          <table className="tabela-itens" style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Nome</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {[
                { id: 1, nome: 'Item Alpha',   status: 'Ativo'    },
                { id: 2, nome: 'Item Beta',    status: 'Pendente' },
                { id: 3, nome: 'Item Gamma',   status: 'Ativo'    },
              ].map(item => (
                <tr key={item.id} style={styles.tr}>
                  <td style={styles.td}>{item.id}</td>
                  <td style={styles.td}>{item.nome}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.badge,
                      backgroundColor: item.status === 'Ativo' ? '#e8f5e9' : '#fff8e1',
                      color:           item.status === 'Ativo' ? '#2e7d32' : '#f57f17',
                    }}>
                      {item.status}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <button style={btnStyle('#e65100', true)}>Editar</button>
                    {' '}
                    <button style={btnStyle('#c62828', true)}>Remover</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Painel de controle do tutorial (apenas para demonstração)       */}
        {/* ---------------------------------------------------------------- */}
        <section style={{ ...styles.section, backgroundColor: '#f9f9f9', borderRadius: '10px', padding: '20px' }}>
          <h2 style={{ ...styles.sectionTitle, marginTop: 0 }}>🎮 Controles do Tutorial</h2>

          <div style={styles.controlRow}>
            <button
              onClick={() => startTour('onboarding', onboardingSteps, true)}
              style={btnStyle('#0066cc')}
            >
              ▶ Onboarding
            </button>

            <button
              onClick={() => startTour('help', helpSteps, true)}
              style={btnStyle('#2e7d32')}
            >
              ▶ Tutorial de Ajuda
            </button>

            <button
              onClick={() => startTour('advanced', advancedDemoSteps, true)}
              style={btnStyle('#7b1fa2')}
            >
              ▶ Demo Avançada
            </button>

            <button
              onClick={() => isRunning ? pauseTour() : resumeTour()}
              style={btnStyle(isRunning ? '#f57c00' : '#37474f')}
              disabled={!activeTour}
            >
              {isRunning ? '⏸ Pausar' : '▶ Retomar'}
            </button>

            <button
              onClick={() => {
                resetTour('onboarding');
                resetTour('help');
                resetTour('advanced');
                alert('Todos os tutoriais foram resetados. Recarregue a página para ver o onboarding automático.');
              }}
              style={btnStyle('#c62828')}
            >
              🗑 Resetar localStorage
            </button>
          </div>

          <div style={styles.statusBox}>
            <p><strong>Tour ativo:</strong> {activeTour?.key ?? '—'}</p>
            <p><strong>Rodando:</strong>    {isRunning ? 'Sim' : 'Não'}</p>
            <p><strong>Passo atual:</strong> {activeTour ? stepIndex + 1 : '—'}</p>
            <p><strong>Onboarding visto:</strong> {hasSeen('onboarding') ? '✓ Sim' : '✗ Não'}</p>
            <p><strong>Ajuda vista:</strong>      {hasSeen('help')       ? '✓ Sim' : '✗ Não'}</p>
          </div>
        </section>
      </main>
    </div>
  );
};

// ==========================================================================
// App — raiz com TourProvider
// ==========================================================================

/**
 * Envolva SEMPRE o TourProvider no nível mais alto possível da aplicação
 * para que useTour() funcione em qualquer componente filho.
 */
const App = () => (
  <TourProvider
    primaryColor="#0066cc"
    accentColor="#ff6b35"
    locale={{
      back:  'Anterior',
      close: 'Fechar',
      last:  'Finalizar',
      next:  'Próximo',
      skip:  'Pular',
    }}
  >
    <AppContent />
  </TourProvider>
);

export default App;

// ==========================================================================
// Estilos auxiliares (inline — substitua por CSS modules / styled-components)
// ==========================================================================

function btnStyle(bg, small = false) {
  return {
    backgroundColor: bg,
    color:           '#ffffff',
    border:          'none',
    borderRadius:    '7px',
    padding:         small ? '4px 10px' : '9px 18px',
    fontSize:        small ? '12px' : '14px',
    fontWeight:      '500',
    cursor:          'pointer',
    transition:      'opacity 0.15s',
    lineHeight:      '1.4',
  };
}

const styles = {
  page: {
    minHeight:   '100vh',
    fontFamily:  '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    color:       '#1a1a1a',
    background:  '#f5f7fa',
  },
  header: {
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'space-between',
    padding:         '14px 28px',
    background:      '#ffffff',
    borderBottom:    '1px solid #e0e0e0',
    boxShadow:       '0 1px 4px rgba(0,0,0,0.06)',
  },
  logo: {
    margin:     0,
    fontSize:   '20px',
    fontWeight: '700',
    color:      '#0066cc',
  },
  nav: {
    display: 'flex',
    gap:     '8px',
  },
  main: {
    maxWidth: '960px',
    margin:   '0 auto',
    padding:  '28px 20px',
    display:  'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  section: {
    background:   '#ffffff',
    borderRadius: '10px',
    padding:      '22px 24px',
    boxShadow:    '0 1px 4px rgba(0,0,0,0.06)',
  },
  sectionTitle: {
    margin:     '0 0 16px',
    fontSize:   '17px',
    fontWeight: '600',
    color:      '#333',
  },
  toolbar: {
    display: 'flex',
    gap:     '10px',
    marginBottom: '16px',
  },
  form: {
    display:  'flex',
    gap:      '10px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  input: {
    border:       '1px solid #ddd',
    borderRadius: '7px',
    padding:      '8px 13px',
    fontSize:     '14px',
    outline:      'none',
    flex:         '1 1 180px',
    minWidth:     '150px',
    color:        '#333',
  },
  table: {
    width:           '100%',
    borderCollapse:  'collapse',
  },
  th: {
    padding:       '11px 14px',
    textAlign:     'left',
    borderBottom:  '2px solid #e0e0e0',
    fontSize:      '13px',
    fontWeight:    '600',
    color:         '#555',
    background:    '#fafafa',
  },
  tr: {
    transition: 'background 0.1s',
  },
  td: {
    padding:      '11px 14px',
    borderBottom: '1px solid #f0f0f0',
    fontSize:     '14px',
    color:        '#333',
  },
  badge: {
    display:      'inline-block',
    padding:      '3px 10px',
    borderRadius: '20px',
    fontSize:     '12px',
    fontWeight:   '500',
  },
  controlRow: {
    display:   'flex',
    gap:       '10px',
    flexWrap:  'wrap',
    marginBottom: '16px',
  },
  statusBox: {
    background:   '#ffffff',
    border:       '1px solid #e8e8e8',
    borderRadius: '8px',
    padding:      '14px 18px',
    fontSize:     '13px',
    lineHeight:   '1.8',
    color:        '#555',
  },
};
