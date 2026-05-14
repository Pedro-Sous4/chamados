// TourProvider.jsx
// Componente raiz do sistema de tour. Fornece o contexto TourContext para
// toda a árvore de componentes e renderiza o <Tour> quando um tour está ativo.

import React, {
  createContext,
  useState,
  useCallback,
  useMemo,
} from 'react';
import Tour from './Tour';

// --------------------------------------------------------------------------
// Contexto exportado para ser consumido por useTour.js
// --------------------------------------------------------------------------
export const TourContext = createContext(null);

// Prefixo das chaves salvas no localStorage
const STORAGE_PREFIX = 'joyride_tour_seen_';

/**
 * Lê as chaves de tours já vistos do localStorage de forma segura.
 * Retorna um objeto { [tourKey]: true } para cada tour persistido.
 */
const loadSeenTours = () => {
  try {
    const seen = {};
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(STORAGE_PREFIX)) {
        seen[key.slice(STORAGE_PREFIX.length)] = true;
      }
    }
    return seen;
  } catch {
    // localStorage pode estar bloqueado (modo incógnito, extensões, etc.)
    return {};
  }
};

// --------------------------------------------------------------------------
// TourProvider
// --------------------------------------------------------------------------

/**
 * TourProvider
 *
 * Envolve a aplicação e expõe o contexto de controle do tutorial.
 * Suporta múltiplos tutoriais identificados por tourKey único.
 *
 * Props:
 *  - children      : ReactNode — árvore da aplicação
 *  - primaryColor  : string   — cor principal dos botões e spotlight (padrão: '#0066cc')
 *  - accentColor   : string   — cor dos beacons e barra de progresso  (padrão: '#ff6b35')
 *  - locale        : object   — sobrescreve textos dos botões do Joyride
 */
const TourProvider = ({
  children,
  primaryColor = '#0066cc',
  accentColor  = '#ff6b35',
  locale,
}) => {
  // Tour atualmente carregado: { key: string, steps: Array } | null
  const [activeTour, setActiveTour] = useState(null);

  // Controla se o Joyride está rodando (permite pausar sem desmontar)
  const [isRunning, setIsRunning] = useState(false);

  // Índice controlado do passo atual
  const [stepIndex, setStepIndex] = useState(0);

  // Mapa de tours já concluídos/pulados, hidratado do localStorage
  const [seenTours, setSeenTours] = useState(loadSeenTours);

  // ------------------------------------------------------------------------
  // startTour — carrega e inicia um tutorial
  // ------------------------------------------------------------------------
  const startTour = useCallback(
    (tourKey, steps, force = false) => {
      if (!tourKey || !Array.isArray(steps) || steps.length === 0) {
        console.warn('[Tour] startTour: "tourKey" e "steps" são obrigatórios e steps não pode ser vazio.');
        return;
      }

      if (!force && seenTours[tourKey]) {
        console.info(
          `[Tour] O tutorial "${tourKey}" já foi concluído pelo usuário. ` +
          'Passe force=true para exibir novamente.'
        );
        return;
      }

      setActiveTour({ key: tourKey, steps });
      setStepIndex(0);
      setIsRunning(true);
    },
    [seenTours]
  );

  // ------------------------------------------------------------------------
  // stopTour — encerra o tutorial e opcionalmente persiste no localStorage
  // ------------------------------------------------------------------------
  const stopTour = useCallback(
    (markAsSeen = true) => {
      if (markAsSeen && activeTour) {
        try {
          localStorage.setItem(STORAGE_PREFIX + activeTour.key, '1');
        } catch {
          // silencia erros de escrita
        }
        setSeenTours(prev => ({ ...prev, [activeTour.key]: true }));
      }

      setIsRunning(false);
      setActiveTour(null);
      setStepIndex(0);
    },
    [activeTour]
  );

  // ------------------------------------------------------------------------
  // pauseTour / resumeTour — controle de pausa sem perder o progresso
  // ------------------------------------------------------------------------
  const pauseTour = useCallback(() => {
    setIsRunning(false);
  }, []);

  const resumeTour = useCallback(() => {
    if (activeTour) {
      setIsRunning(true);
    } else {
      console.warn('[Tour] resumeTour: nenhum tutorial ativo para retomar.');
    }
  }, [activeTour]);

  // ------------------------------------------------------------------------
  // resetTour — remove a persistência para permitir re-exibição
  // ------------------------------------------------------------------------
  const resetTour = useCallback((tourKey) => {
    if (!tourKey) return;
    try {
      localStorage.removeItem(STORAGE_PREFIX + tourKey);
    } catch {}
    setSeenTours(prev => {
      const next = { ...prev };
      delete next[tourKey];
      return next;
    });
  }, []);

  // ------------------------------------------------------------------------
  // Navegação entre passos (usada pelo Tour.jsx via callback do Joyride)
  // ------------------------------------------------------------------------
  const nextStep = useCallback(() => {
    setStepIndex(prev => prev + 1);
  }, []);

  const prevStep = useCallback(() => {
    setStepIndex(prev => Math.max(0, prev - 1));
  }, []);

  const skipTour = useCallback(() => {
    stopTour(true);
  }, [stopTour]);

  // Verifica se um tutorial específico já foi visto
  const hasSeen = useCallback(
    (tourKey) => Boolean(seenTours[tourKey]),
    [seenTours]
  );

  // ------------------------------------------------------------------------
  // Valor do contexto — memoizado para evitar re-renderizações desnecessárias
  // ------------------------------------------------------------------------
  const contextValue = useMemo(
    () => ({
      isRunning,
      stepIndex,
      activeTour,
      startTour,
      stopTour,
      pauseTour,
      resumeTour,
      resetTour,
      nextStep,
      prevStep,
      skipTour,
      hasSeen,
      primaryColor,
      accentColor,
      locale,
    }),
    [
      isRunning, stepIndex, activeTour,
      startTour, stopTour, pauseTour, resumeTour,
      resetTour, nextStep, prevStep, skipTour, hasSeen,
      primaryColor, accentColor, locale,
    ]
  );

  return (
    <TourContext.Provider value={contextValue}>
      {children}

      {/*
        O componente <Tour> só é montado quando há um tour ativo.
        Ele renderiza o Joyride via createPortal no document.body,
        garantindo que o overlay sempre fique sobre tudo.
      */}
      {activeTour && <Tour />}
    </TourContext.Provider>
  );
};

export default TourProvider;
