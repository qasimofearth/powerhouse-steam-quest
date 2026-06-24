import { ReactNode } from 'react';
import { DialogSizeType, Direction, LogoTheme } from '../constants/constants';

export interface GameContextType {
  currentSceneIndex: number;
  setCurrentSceneIndex: React.Dispatch<React.SetStateAction<number>>;
  dialogIndex: number;
  setDialogIndex: React.Dispatch<React.SetStateAction<number>>;
  language: string;
  setLanguage: React.Dispatch<React.SetStateAction<string>>;
  popoverState: PopoverState | null;
  setPopoverState: (state: PopoverState | null) => void;
  responses: ResponseState[];
  setResponses: React.Dispatch<React.SetStateAction<ResponseState[]>>;
  isTranslationsLoaded: boolean;
  setIsTranslationsLoaded: React.Dispatch<React.SetStateAction<boolean>>;
  translations: Record<string, string>;
  setTranslations: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  sceneProgressCount: number;
  setSceneProgressCount: React.Dispatch<React.SetStateAction<number>>;
  interactiveResponses: Record<string, Record<string, string | number | boolean | null>>;
  setInteractiveResponses: React.Dispatch<
    React.SetStateAction<Record<string, Record<string, string | number | boolean | null>>>
  >;
  showContent: boolean;
  setShowContent: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface GameProviderProps {
  children: ReactNode;
}

export interface BackgroundProps {
  alt?: string;
  blur?: BlurConfig | number;
  zoom?: ZoomConfig | number;
  backgroundImage: string;
  pan?: number;
  waitDelay?: number;
  initialZoom?: number;
}

export interface BlurConfig {
  amount: number;
  radius?: number;
}

export interface ZoomConfig {
  scale: number;
  duration?: number;
  timingFunction?: string;
}

export interface DialogProps {
  dialogIndex?: number;
  heading?: string;
  body?: string;
  bodyAsHtml?: string;
  backgroundColor?: string;
  width?: string;
  headingColor?: string;
  onBack?: () => void;
  onNext?: () => void;
  avatar?: AvatarData;
  controls?: DialogControls[];
  about?: PopoverData[];
  help?: PopoverData[];
  glossary?: GlossaryItem[];
  interactions?: Interaction[];
  buttonAlignment?: 'left' | 'right';
  onHeightChange?: () => void;
  dialogSizeType?: DialogSizeType.FULL;
  disableAnimation?: boolean;
  isPrimaryHeading?: boolean;
  dialogKey?: string;
  events?: SceneEvent[];
  leftDialogPaddingOverride?: LeftDialogPaddingOverrideType;
  contentBackgroundColor?: string;
}

export interface NavigationControlsProps {
  onBack?: () => void;
  onNext?: () => void;
  backText?: string;
  nextText?: string;
  startText?: string;
  backDisabled?: boolean;
  nextDisabled?: boolean;
  isSubmitted?: boolean;
  controls?: DialogControls[];
  interactionStates?: InteractionState[] | null;
  buttonState?: 'next' | 'correct' | 'try-again';
  buttonAlignment?: 'left' | 'right';
  dialogSizeType?: DialogSizeType.FULL;
  styles: {
    full: {
      navigation: React.CSSProperties;
    };
  };
  setIsSubmitTriggered: React.Dispatch<React.SetStateAction<boolean>>;
  events?: SceneEvent[];
}

export interface NavigationControlsRef {
  handleExplicitSubmit: () => void;
}

export interface AvatarProps {
  src: string;
  alt: string;
  size?: AvatarSize;
  className?: string;
  mirrored?: boolean;
  background?: string;
  position?: 'left' | 'right';
}

export type AvatarSize = 'small' | 'medium' | 'large' | 'chat-bubble' | 'chat-bubble-square' | 'enlarged';

export type AvatarChatBubbleSize = Extract<AvatarSize, 'chat-bubble' | 'chat-bubble-square'>;

export interface AvatarDimensions {
  width: string;
  height: string;
}

export interface AvatarSizeMap {
  small: AvatarDimensions;
  medium: AvatarDimensions;
  large: AvatarDimensions;
  'chat-bubble': AvatarDimensions;
  'chat-bubble-square': AvatarDimensions;
  enlarged: AvatarDimensions;
}

export interface CustomLogoURL {
  light: string;
  dark: string;
}

export interface BaseSceneData {
  name?: string;
  background: {
    alt?: string;
    url: string;
    pan?: number;
    zoom?: number;
    blur?: number;
    waitDelay?: number;
    initialZoom?: number;
  };
  audioUrl?: string;
  customLogoUrl?: CustomLogoURL;
  logoTheme?: {
    landscape: LogoTheme;
    portrait: LogoTheme;
  };
  type: DialogType;
}

export type DialogType = 'one-at-a-time' | 'split-screen-chat' | 'turn-based-chat' | 'end-screen';

export type DialogControlTypes = 'back' | 'next' | 'start' | 'submit';

export type DialogControls = {
  type: DialogControlTypes;
  text?: string;
};

export interface DialogContainerProps extends DialogProps {
  position?: React.CSSProperties;
}

export interface DialogData {
  isPrimaryHeading?: boolean;
  heading: string;
  body?: string;
  bodyAsHtml?: string;
  headingColor: string;
  position?: Position;
  avatar?: AvatarData;
  background?: {
    blur?: BlurConfig | number;
    zoom?: number;
    pan?: number;
  };
  controls?: DialogControls[];
  audioUrl?: string;
  about?: PopoverData[];
  help?: PopoverData[];
  glossary?: GlossaryItem[];
  interactions?: Interaction[];
  side?: 'left' | 'right';
  discardPrevious?: boolean;
  skipNavigation?: boolean;
  buttonAlignment?: 'left' | 'right';
  width?: string;
  showTextBox?: boolean;
  disableAnimation?: boolean;
  events?: SceneEvent[];
  contentBackgroundColor?: string;
}

export type EventTriggerType = 'on-next' | 'on-back';

export interface SceneEvent {
  payload: {
    target: string;
    [key: string]:
      | string
      | number
      | boolean
      | null
      | ((interactiveResponses: Record<string, Record<string, string | number | boolean | null>>) => boolean)
      | object;
  };
  triggers: EventTriggerType[];
}

export interface Interaction {
  name: string;
  config: string;
  enableStateExchange?: boolean;
}

export interface GlossaryItem {
  word: string;
  definitionAsHtml: string;
  global?: boolean;
}

export interface PopoverData {
  heading: string;
  body?: string;
  bodyAsHtml?: string;
  accentColor?: string;
  shouldShake?: boolean;
}

export interface AvatarData {
  src: string;
  alt: string;
  size: AvatarSize;
  background?: string;
  mirrored?: boolean;
  position?: 'left' | 'right';
  animation?: {
    duration: number;
    delay: number;
    entry: string;
    exit: string;
  };
}

export interface Position {
  left?: string;
  right?: string;
  bottom?: string;
  top?: string;
}

export interface AudioConfig {
  volume?: number;
  loop?: boolean;
}

export interface SceneData extends BaseSceneData {
  type: DialogType;
  dialogs: DialogData[];
  showConfetti?: boolean;
  leftConfig?: {
    blur?: number;
    background?: string;
    position?: string;
  };
}

export interface SceneDataProps {
  dialogIndex: number;
  currentScene: SceneData;
  sceneIndex?: number;
  onNext: () => void;
  onBack: () => void;
}

export interface SceneProps {
  sceneData: SceneData[];
}

export interface VolumeControlProps {
  backgroundVolume: number;
  setBackgroundVolume: React.Dispatch<React.SetStateAction<number>>;
  dialogVolume: number;
  setDialogVolume: React.Dispatch<React.SetStateAction<number>>;
  setShowVolumeControl: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface GlossaryMatch {
  word: string;
  start: number;
  end: number;
}

export interface GlossaryState extends GlossaryItem {
  position: {
    x: number;
    y: number;
  };
}

export interface PopoverState {
  heading?: string;
  body?: string;
  bodyAsHtml?: string;
  accentColor?: string;
  position?: {
    x: number;
    y: number;
  };
  triggerRef?: React.RefObject<HTMLDivElement>;
  customStyle?: {
    width?: string;
  };
}

export interface ButtonStyles {
  base: {
    [key: string]: string;
  };
  classes: {
    common: string;
    secondary: { enabled: string; disabled: string };
    primary: { enabled: string; disabled: string };
    start: { enabled: string; disabled: string };
  };
}

export type ButtonVariant = 'secondary' | 'primary' | 'start';

export interface UsePreloaderResult {
  isLoading: boolean;
  loadingProgress: number;
  error: string | null;
}

export interface InteractionState {
  isCorrect?: boolean;
  isEmpty?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value?: any; // value can be any type
  interactionType?: string;
}

export interface ResponseState {
  id: string; // id is sceneIndex_dialogIndex_interactionIndex
  state: InteractionState;
  isSubmitted?: boolean;
}

export interface AudioControlButtonsProps {
  isDialogPlaying: boolean;
  isDialogDonePlaying: boolean;
  handleDialogAudio: () => void;
  isMuted: boolean;
  toggleMute: () => void;
  showVolumeControl: boolean;
  setShowVolumeControl: React.Dispatch<React.SetStateAction<boolean>>;
  backgroundVolume: number;
  setBackgroundVolume: React.Dispatch<React.SetStateAction<number>>;
  dialogVolume: number;
  setDialogVolume: React.Dispatch<React.SetStateAction<number>>;
  hasDialogAudio?: boolean;
}

type SvgComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;

export interface SvgModule {
  default: SvgComponent;
}

export interface SceneTransitionOptions {
  nextSceneIndex?: number;
  nextDialogIndex?: number;
  skippedScenes?: number;
}

export interface SceneTransitionContextType {
  handleDirectionalSceneTransition: (direction: Direction.NEXT | Direction.BACK) => void;
  handleExactSceneTransition: (options: SceneTransitionOptions) => void;
  findNextValidDialog?: (
    sceneIndex: number,
    startDialogIndex: number,
    direction: Direction.NEXT | Direction.BACK,
  ) => void;
  isTransitioningForward: boolean;
  branchState: BranchState;
}

export interface SceneTransitionProviderProps {
  children: ReactNode;
  sceneData: SceneData[];
}

export interface Branch {
  path: string;
  isCompleted: boolean;
}

export interface BranchPoint {
  root: string;
  branches: Branch[];
}

export interface BranchState {
  completeBranch: (sceneDialogKey: string) => void;
  isEndOfBranch: (sceneDialogKey: string) => boolean;
  getNextBranch: (sceneDialogKey: string) => { startSceneIndex: number; startDialogIndex: number } | null;
  getHighestEndPath: (sceneDialogKey: string) => { endSceneIndex: number; endDialogIndex: number } | null;
  resolvePath: (path: string) => {
    startSceneIndex: number;
    startDialogIndex: number;
    endSceneIndex: number;
    endDialogIndex: number;
  };
  resetBranchState: () => void;
  getBranch: (sceneDialogKey: string) => Branch | null;
  getOtherBranchesSceneCount: (sceneDialogKey: string) => number;
  getBranchMap: () => {
    [key: string]: {
      root: string;
      branchIndex: number;
    };
  };
}

export interface ScormContextType {
  isInitialized: boolean;
  setScore: (score: number, minScore?: number, maxScore?: number) => void;
  setStatus: (status: 'completed' | 'incomplete' | 'failed' | 'passed') => void;
  setLocation: (location: string) => void;
  getLearnerName: () => string;
}

export interface GlossaryEntry {
  tid: string;
  englishTerm: string;
  englishDefinition: string;
  spanishTerm: string;
  spanishDefinition: string;
}

export type EventData = unknown;
export type EventCallback = (data?: EventData) => void;
export type EventMap = Map<string, Set<EventCallback>>;

type PaddingOverride = Record<string, string>;

export interface LeftDialogPaddingOverrideType {
  container: PaddingOverride;
  header: PaddingOverride;
  body: PaddingOverride;
}
export interface Quest {
  id: string;
  title: string;
  subtitle: string;
  section: string;
  isDisabled: boolean;
  figmaLink?: string;
  scormPackageUrl?: string;
  demoLink: string;
  questTimeStamp?: {
    updatedAt: string;
    createdAt: string;
    latestCommitHash?: string;
  };
}
export interface TimeStatusProps {
  questTimeStamp?: {
    updatedAt: string;
    createdAt: string;
    latestCommitHash?: string;
  };
  showDetails?: boolean;
}
export interface QuestLastUpdated {
  updatedAt: string;
  createdAt: string;
  latestCommitHash?: string | null;
}

export type QuestLastUpdatedRecord = Record<string, QuestLastUpdated>;
