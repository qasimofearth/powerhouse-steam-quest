import { AvatarChatBubbleSize } from '../types/interfaces';

export const BUTTON_STYLES = {
  base: {
    fontFamily: 'avenir-next, sans-serif',
    fontSize: '1.25rem',
    fontStyle: 'normal',
    fontWeight: 500,
    lineHeight: 'normal',
  },
  classes: {
    common: `
            px-2 py-1 rounded transition-colors text-center
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            lg:px-4 lg:py-2
        `,
    secondary: {
      enabled: 'text-[#006BE0] bg-white hover:bg-blue-100 border border-blue-500',
      disabled: 'text-gray-400 border-gray-400 cursor-not-allowed border',
    },
    primary: {
      enabled: 'bg-[#006BE0] hover:bg-blue-600 text-white',
      disabled: 'bg-gray-400 cursor-not-allowed text-white',
    },
    start: {
      enabled: 'bg-[#006BE0] hover:bg-blue-600 text-white',
      disabled: 'bg-gray-400 cursor-not-allowed text-white',
    },
  },
};

export const ICONS = {
  play: 'play',
  audio: 'audio',
  mute: 'mute',
  pause: 'pause',
  refresh: 'refresh',
  close: 'close',
  info: 'info',
  resources: 'resources',
  figma: 'figma',
  download: 'download',
  'chevron-down': 'chevron-down',
  'correct-checkmark': 'correct-checkmark',
  'caret-left': 'caret-left',
  'caret-right': 'caret-right',
  check_mark: 'check_mark',
  'volume-control': 'volume-control',
};

export const CHAT_BUBBLE_AVATAR_TYPES: AvatarChatBubbleSize[] = ['chat-bubble', 'chat-bubble-square'];

export const DURATIONS = {
  animation: 300,
  heightTransition: 300,
  leftDialogRenderDelay: 2000,
  turnBasedChatOpacity: 800,
};

export const EXCLUDE_TAGS_FOR_HIGHLIGHTING = ['button', 'input', 'no-glossary'];

export const ENTER_KEY = 'Enter';
export const SPACEBAR_KEY = ' ';

export const KEY_DOWN = 'keydown';

export const SUPERSCRIPTS = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
} as const;

export const LAUNCHER = 'launcher';

export const POSITION = {
  LEFT: 'left',
  RIGHT: 'right',
};
export const POSITION_CLASSES = {
  BOTTOM_LEFT: 'bottom-0 left-0',
  BOTTOM_RIGHT: 'bottom-0 right-0',
};

export const SCREEN_CONSTANTS = {
  ZOOM_LEVELS: {
    DPR_200_MIN: 2,
  },
};

export const BUTTON_SHAKING_INTERVAL = 15000;

export const POPOVER_CONSTANTS = {
  FOCUS_DELAY: 100,
  SCROLL: {
    AMOUNT: 100,
  },
  POPOVER_WIDTH: 515,
  MIN_SPACE_BELOW_RATIO: 0.3,
  HORIZONTAL_GAP: 10,
  TOP_OFFSET: 50,
  BOTTOM_OFFSET: 35,
};

export enum SceneType {
  OneAtATime = 'one-at-a-time',
  TurnBasedChat = 'turn-based-chat',
  SplitScreenChat = 'split-screen-chat',
  EndScreen = 'end-screen',
}

export enum Direction {
  NEXT = 'next',
  BACK = 'back',
}

export enum DialogSizeType {
  FULL = 'full',
}

export enum KeyboardKeys {
  ARROW_DOWN = 'ArrowDown',
  ARROW_UP = 'ArrowUp',
  PAGE_DOWN = 'PageDown',
  PAGE_UP = 'PageUp',
  HOME = 'Home',
  END = 'End',
  ESCAPE = 'Escape',
}

export enum DialogWidth {
  START_SCREEN = '80.55vw',
}

export enum DialogPosition {
  START_SCREEN_TOP = '65%',
  START_SCREEN_LEFT = '50%',
}

export const GAME_TITLES = new Map([
  ['breakeven', 'game.breakeven'],
  ['virus', 'game.virus'],
  ['pricing-dilemma', 'game.pricing-dilemma'],
  ['skytrack-internship', 'game.skytrack-internship'],
  ['critical-point', 'game.critical-point'],
  ['baseball-game-plan', 'game.baseball-game-plan'],
  ['kelp-forest-defenders', 'game.kelp-forest-defenders'],
  ['lunar-probe-precision', 'game.lunar-probe-precision'],
  ['get-in-the-zone', 'game.get-in-the-zone'],
  ['atacama', 'game.atacama'],
  ['game-geometry', 'game.game-geometry'],
  ['engineering-the-perfect-beat', 'game.engineering-the-perfect-beat'],
  ['ancient-alexandria', 'game.ancient-alexandria'],
  ['euclid-path', 'game.euclid-path'],
  ['inbox-under-siege', 'game.inbox-under-siege'],
  ['data-analysis', 'game.data-analysis'],
  ['optical-illusions', 'game.optical-illusions'],
  ['shaping-sound', 'game.shaping-sound'],
  ['journey-through-waves', 'game.journey-through-waves'],
  ['falling-into-orbit', 'game.falling-into-orbit'],
  ['lost-hiker', 'game.lost-hiker'],
  ['musical-scale', 'game.musical-scale'],
  ['coordinate-geometry', 'game.coordinate-geometry'],
  ['similar-triangles', 'game.similar-triangles'],
  ['exponential-model', 'game.exponential-model'],
  ['calculated-rescue', 'game.calculated-rescue'],
  ['al-khwarizmi', 'game.al-khwarizmi'],
  ['fractals', 'game.fractals'],
  ['polynomial-pirates', 'game.polynomial-pirates'],
  ['mathematical-architecture', 'game.mathematical-architecture'],
  ['pythagoras-quest', 'game.pythagoras-quest'],
  ['are-we-alone', 'game.are-we-alone'],
  ['playground', 'STEAM Quest - Playground'],
  ['launcher', 'STEAM Quest - Launcher'],
]);

export const MAX_POPOVER_WIDTH = 400;

export const POPOVER_ARROW_WIDTH = 14;

export enum Environment {
  PRODUCTION = 'production',
}

export enum LogoTheme {
  LIGHT = 'light',
  DARK = 'dark',
}

export const DIALOG_DELAY_OVER_AVATAR = 200;

export const SCENE_CHANGE_DELAY = 2000;

export const DOMAIN = 'quests.playpower.ai';
export const S3_BUCKET_NAME = 'quests-core-app';
export const GAME_DATA_PATH = './src/GAME_DATA';
export const LAST_UPDATED_FILENAME = 'last-updated.json';
export const LAST_UPDATED_DIST_PATH = 'dist/last-updated.json';
export const QUEST_ASSET_BASE_URL = `https://${S3_BUCKET_NAME}.s3.us-east-1.amazonaws.com/`;

//Google Drive folder listed on launcher for shared resources
export const COMMON_DRIVE_LINK =
  'https://drive.google.com/drive/folders/1ii_iy2DibaxqUZ46UGgO2vWA0VQoWwyV?usp=sharing';
