// useTour.js
// Hook público para consumir o contexto do tour em qualquer componente filho.
// Deve ser usado sempre dentro de um <TourProvider>.

import { useContext } from 'react';
import { TourContext } from './TourProvider';

/**
 * useTour
 *
 * Retorna o estado e as funções de controle do tutorial ativo.
 *
 * @returns {{
 *   isRunning: boolean,           — se o tutorial está em execução
 *   stepIndex: number,            — índice do passo atual
 *   activeTour: {key:string, steps:Array}|null, — tutorial ativo
 *   startTour: (tourKey: string, steps: Array, force?: boolean) => void,
 *   stopTour:  (markAsSeen?: boolean) => void,
 *   pauseTour: () => void,
 *   resumeTour: () => void,
 *   resetTour: (tourKey: string) => void,
 *   nextStep:  () => void,
 *   prevStep:  () => void,
 *   skipTour:  () => void,
 *   hasSeen:   (tourKey: string) => boolean,
 *   primaryColor: string,
 *   accentColor:  string,
 * }}
 */
const useTour = () => {
  const context = useContext(TourContext);

  if (!context) {
    throw new Error(
      '[Tour] useTour() deve ser chamado dentro de um <TourProvider>. ' +
      'Certifique-se de que o componente está envolvido pelo provider.'
    );
  }

  return context;
};

export default useTour;
