// tour/index.js
// Ponto de entrada público do sistema de tour.
// Importe a partir deste arquivo para manter os imports limpos:
//
//   import { TourProvider, useTour } from './tour';

export { default as TourProvider, TourContext } from './TourProvider';
export { default as useTour }                    from './useTour';
export { default as Tour }                       from './Tour';
export * from './steps';
