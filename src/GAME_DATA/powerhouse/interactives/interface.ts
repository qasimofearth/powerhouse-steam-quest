// Interaction type definitions for the "Powerhouse" mitochondria quest.

export interface InteractionState {
  isCorrect?: boolean;
  isEmpty?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value?: any;
  interactionType?: string;
}

export interface RadioButtonInteraction {
  type: 'radio-button';
  title: string;
  prefixText?: string;
  options: { value: string; label: string }[];
  correctnessFunction: (selectedValue: string) => boolean;
  ariaLabel?: string;
}

export interface InputBoxInteraction {
  type: 'input-box';
  title: string;
  prefixText?: string;
  ariaLabel: string;
  hint?: string;
  placeholder_1?: string;
  placeholder_2?: string;
  correctnessFunction: (inputValues: string | number) => boolean;
}

// ---- Custom Three.js / interactive components ----

export interface MitochondrionExplorerInteraction {
  type: 'mitochondrion-explorer';
  ariaLabel?: string;
}

export interface AtpSynthaseInteraction {
  type: 'atp-synthase';
  ariaLabel?: string;
}

export interface Vo2maxLabInteraction {
  type: 'vo2max-lab';
  ariaLabel?: string;
}

export interface TrainingSimInteraction {
  type: 'training-sim';
  ariaLabel?: string;
}

export interface BrownFatInteraction {
  type: 'brown-fat';
  ariaLabel?: string;
}

export interface MaternalLineInteraction {
  type: 'maternal-line';
  ariaLabel?: string;
}

export interface EndosymbiosisInteraction {
  type: 'endosymbiosis';
  ariaLabel?: string;
}

export interface AxonalTransportInteraction {
  type: 'axonal-transport';
  ariaLabel?: string;
}

export interface RespirationBuilderInteraction {
  type: 'respiration-builder';
  ariaLabel?: string;
}

export interface SprintIntensityInteraction {
  type: 'sprint-intensity';
  ariaLabel?: string;
}

export type Interaction =
  | RadioButtonInteraction
  | InputBoxInteraction
  | MitochondrionExplorerInteraction
  | AtpSynthaseInteraction
  | Vo2maxLabInteraction
  | TrainingSimInteraction
  | BrownFatInteraction
  | MaternalLineInteraction
  | EndosymbiosisInteraction
  | AxonalTransportInteraction
  | RespirationBuilderInteraction
  | SprintIntensityInteraction;
