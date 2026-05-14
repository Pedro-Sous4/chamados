// Tour.jsx
// Encapsula o react-joyride com suporte a:
//   - Ações automáticas por step (click, type, wait)
//   - Retry via MutationObserver para elementos renderizados dinamicamente
//   - Estilos customizáveis via props do TourProvider
//   - Renderização no body via createPortal para z-index correto

import React, { useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import Joyride, { ACTIONS, EVENTS, STATUS } from 'react-joyride';
import useTour from './useTour';

// --------------------------------------------------------------------------
// Utilitário: aguardar elemento no DOM
// --------------------------------------------------------------------------

/**
 * waitForElement
 *
 * Aguarda um elemento CSS aparecer no DOM usando MutationObserver.
 * Evita polling e funciona com renderizações dinâmicas (ex: modais, listas lazy).
 *
 * @param {string} selector  — seletor CSS
 * @param {number} timeout   — tempo máximo de espera em ms (padrão: 5000)
 * @returns {Promise<Element>}
 */
const waitForElement = (selector, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    // Checa se o elemento já existe
    const existing = document.querySelector(selector);
    if (existing) {
      resolve(existing);
      return;
    }

    // Observa mudanças no DOM
    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        clearTimeout(timer);
        resolve(el);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: false,
    });

    const timer = setTimeout(() => {
      observer.disconnect();
      reject(
        new Error(
          `[Tour] Elemento "${selector}" não encontrado após ${timeout}ms. ` +
          'Verifique o seletor ou se o elemento é renderizado a tempo.'
        )
      );
    }, timeout);
  });
};

// --------------------------------------------------------------------------
// Utilitário: executar ação automática de um step
// --------------------------------------------------------------------------

/**
 * executeStepAction
 *
 * Executa a ação definida no step (click, type, wait) usando querySelector
 * e dispatchEvent para compatibilidade com React e outros frameworks.
 *
 * @param {{ target:string, action:string, value?:string, delay?:number }} step
 */
const executeStepAction = async (step) => {
  if (!step?.action) return;

  const { action, target, value, delay = 1000 } = step;

  try {
    const el = await waitForElement(target);

    switch (action) {
      // ------------------------------------------------------------------
      // click — dispara sequência mousedown → mouseup → click
      // ------------------------------------------------------------------
      case 'click': {
        el.focus?.();
        el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        el.dispatchEvent(new MouseEvent('mouseup',   { bubbles: true, cancelable: true }));
        el.dispatchEvent(new MouseEvent('click',     { bubbles: true, cancelable: true }));
        console.info(`[Tour] Ação 'click' executada em: ${target}`);
        break;
      }

      // ------------------------------------------------------------------
      // type — digita caractere a caractere, compatível com React controlled inputs
      // ------------------------------------------------------------------
      case 'type': {
        if (value === undefined) {
          console.warn("[Tour] Ação 'type' requer a prop 'value' no step.");
          break;
        }

        el.focus?.();

        // Usa o setter nativo para que o React detecte a mudança de valor
        const nativeSetter =
          Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set ||
          Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;

        const setValue = (v) => {
          if (nativeSetter) {
            nativeSetter.call(el, v);
          } else {
            el.value = v;
          }
        };

        // Limpa o campo
        setValue('');
        el.dispatchEvent(new Event('input', { bubbles: true }));

        // Digita caractere a caractere com pequeno delay para simular digitação
        for (const char of String(value)) {
          el.dispatchEvent(new KeyboardEvent('keydown',  { key: char, bubbles: true }));
          el.dispatchEvent(new KeyboardEvent('keypress', { key: char, bubbles: true }));
          setValue(el.value + char);
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new KeyboardEvent('keyup', { key: char, bubbles: true }));
          // Pequeno atraso para efeito visual de digitação
          await new Promise(r => setTimeout(r, 35));
        }

        el.dispatchEvent(new Event('change', { bubbles: true }));
        console.info(`[Tour] Ação 'type' executada em: ${target} — valor: "${value}"`);
        break;
      }

      // ------------------------------------------------------------------
      // wait — pausa antes de avançar para o próximo passo
      // ------------------------------------------------------------------
      case 'wait': {
        await new Promise(r => setTimeout(r, delay));
        console.info(`[Tour] Ação 'wait' concluída: ${delay}ms`);
        break;
      }

      default:
        console.warn(`[Tour] Ação desconhecida: "${action}". Ações suportadas: click, type, wait.`);
    }
  } catch (err) {
    // Não quebramos o tour por causa de um elemento ausente — apenas logamos
    console.warn(err.message);
  }
};

// --------------------------------------------------------------------------
// Localização padrão (português)
// --------------------------------------------------------------------------
const DEFAULT_LOCALE = {
  back:  'Anterior',
  close: 'Fechar',
  last:  'Finalizar',
  next:  'Próximo',
  open:  'Abrir diálogo',
  skip:  'Pular tutorial',
};

// --------------------------------------------------------------------------
// Tour
// --------------------------------------------------------------------------

/**
 * Tour
 *
 * Componente interno renderizado pelo TourProvider quando um tour está ativo.
 * Consome o contexto via useTour() e renderiza o Joyride no document.body
 * usando createPortal para garantir que o overlay sobreponha toda a aplicação.
 *
 * Não deve ser instanciado diretamente — use TourProvider + useTour.
 */
const Tour = () => {
  const {
    isRunning,
    stepIndex,
    activeTour,
    nextStep,
    prevStep,
    stopTour,
    primaryColor,
    accentColor,
    locale: localeProp,
  } = useTour();

  const steps     = activeTour?.steps ?? [];
  // Guard para evitar re-entrada durante ações assíncronas
  const actionRef = useRef(false);

  // ------------------------------------------------------------------------
  // Mapeia os steps customizados para o formato esperado pelo Joyride
  // ------------------------------------------------------------------------
  const joyrideSteps = steps.map((step) => ({
    target:          step.target,
    title:           step.title,
    content:         step.content,
    placement:       step.placement      ?? 'auto',
    disableBeacon:   step.disableBeacon  ?? true,
    spotlightClicks: step.spotlightClicks ?? false,
    hideFooter:      step.hideFooter     ?? false,
    // Dados extras passados de volta pelo callback do Joyride (não usados pelo Joyride,
    // mas preservados para referência — a lógica de ação usa `steps[index]` diretamente)
    data: {
      action: step.action,
      value:  step.value,
      delay:  step.delay,
    },
  }));

  // ------------------------------------------------------------------------
  // Callback principal do Joyride
  // Gerencia navegação, ações automáticas e término do tour.
  // ------------------------------------------------------------------------
  const handleCallback = useCallback(
    async (data) => {
      const { action, index, status, type } = data;

      // ---- Tour finalizado normalmente (último passo) ----
      if (status === STATUS.FINISHED) {
        // Executa ação do último passo se houver
        if (!actionRef.current) {
          const lastStep = steps[index];
          if (lastStep?.action) {
            actionRef.current = true;
            await executeStepAction(lastStep);
            actionRef.current = false;
          }
        }
        stopTour(true);
        return;
      }

      // ---- Tour pulado pelo usuário ----
      if (status === STATUS.SKIPPED) {
        stopTour(true);
        return;
      }

      // ---- Elemento alvo não encontrado no DOM ----
      if (type === EVENTS.TARGET_NOT_FOUND) {
        console.warn(
          `[Tour] Alvo não encontrado para o passo ${index}: "${steps[index]?.target}". ` +
          'Avançando para o próximo passo.'
        );
        nextStep();
        return;
      }

      // ---- Após interação com o step (clique em botão do tooltip) ----
      if (type === EVENTS.STEP_AFTER) {
        if (actionRef.current) return; // evita re-entrada

        if (action === ACTIONS.NEXT) {
          // Executa ação automática definida no step atual antes de avançar
          const currentStep = steps[index];
          if (currentStep?.action) {
            actionRef.current = true;
            await executeStepAction(currentStep);
            actionRef.current = false;
          }
          nextStep();
        } else if (action === ACTIONS.PREV) {
          prevStep();
        } else if (action === ACTIONS.SKIP || action === ACTIONS.CLOSE) {
          stopTour(true);
        }
      }
    },
    [steps, nextStep, prevStep, stopTour]
  );

  // ------------------------------------------------------------------------
  // Estilos do Joyride — customizáveis via primaryColor / accentColor
  // ------------------------------------------------------------------------
  const joyrideStyles = {
    options: {
      arrowColor:    '#ffffff',
      backgroundColor: '#ffffff',
      overlayColor:  'rgba(0, 0, 0, 0.70)',
      primaryColor:  primaryColor,
      textColor:     '#333333',
      zIndex:        10000,
      width:         390,
    },
    tooltip: {
      borderRadius: '12px',
      boxShadow:    '0 8px 32px rgba(0,0,0,0.20), 0 2px 8px rgba(0,0,0,0.10)',
      padding:      '22px 26px',
      fontFamily:   'inherit',
    },
    tooltipContainer: {
      textAlign: 'left',
    },
    tooltipTitle: {
      fontSize:     '16px',
      fontWeight:   '600',
      color:        '#1a1a1a',
      marginBottom: '8px',
      lineHeight:   '1.4',
    },
    tooltipContent: {
      fontSize:   '14px',
      lineHeight: '1.65',
      color:      '#555555',
      padding:    0,
    },
    tooltipFooter: {
      marginTop:    '18px',
      paddingTop:   '12px',
      borderTop:    '1px solid #f0f0f0',
      alignItems:   'center',
    },
    // Barra de progresso (Step X of Y)
    tooltipFooterSpacer: {
      flex: 1,
    },
    buttonNext: {
      backgroundColor: primaryColor,
      borderRadius:    '8px',
      padding:         '8px 22px',
      fontWeight:      '600',
      fontSize:        '14px',
      color:           '#ffffff',
      border:          'none',
      cursor:          'pointer',
      lineHeight:      '1.4',
    },
    buttonBack: {
      color:       primaryColor,
      marginRight: '8px',
      fontSize:    '14px',
      fontWeight:  '500',
      background:  'none',
      border:      'none',
      cursor:      'pointer',
      padding:     '0',
    },
    buttonSkip: {
      color:      '#aaaaaa',
      fontSize:   '13px',
      background: 'none',
      border:     'none',
      cursor:     'pointer',
      padding:    '0',
    },
    buttonClose: {
      color:  '#cccccc',
      width:  '14px',
      height: '14px',
    },
    spotlight: {
      borderRadius: '8px',
    },
    overlay: {
      mixBlendMode: 'normal',
    },
    // Beacon (indicador pulsante antes de o tooltip abrir)
    beaconInner: {
      backgroundColor: accentColor,
    },
    beaconOuter: {
      borderColor:     accentColor,
      backgroundColor: `${accentColor}33`,
    },
  };

  const mergedLocale = { ...DEFAULT_LOCALE, ...(localeProp ?? {}) };

  // ------------------------------------------------------------------------
  // Renderiza o Joyride no document.body via createPortal
  // Isso garante que o overlay fique sempre por cima de tudo, independentemente
  // do stacking context da aplicação (position, transform, z-index, etc.)
  // ------------------------------------------------------------------------
  return createPortal(
    <Joyride
      steps={joyrideSteps}
      stepIndex={stepIndex}
      run={isRunning}
      // --- Comportamento ---
      continuous            // exibe botão "Próximo" em todos os passos
      showProgress          // "Passo X de Y" no footer
      showSkipButton        // botão de pular
      scrollToFirstStep     // rola até o primeiro elemento
      scrollOffset={80}     // margem acima do elemento ao rolar
      disableCloseOnEsc={false}      // ESC fecha o tour
      disableOverlayClose={false}    // clicar no overlay fecha
      spotlightPadding={6}           // espaço ao redor do elemento destacado
      disableScrolling={false}       // permite scroll automático
      // --- Callbacks e estilos ---
      callback={handleCallback}
      styles={joyrideStyles}
      locale={mergedLocale}
      // --- Animação do tooltip (via react-floater) ---
      floaterProps={{
        disableAnimation: false,
        styles: {
          floater: { zIndex: 10001 },
        },
      }}
    />,
    document.body
  );
};

export default Tour;
