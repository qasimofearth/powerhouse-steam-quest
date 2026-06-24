import { DialogPosition, DialogWidth, LogoTheme, SCENE_CHANGE_DELAY } from '../../constants/constants';
import { SceneData } from '../../types/interfaces';

// Character colors
const MAYA_COLOR = '#E0552B'; // energetic orange for Maya
const DRO_COLOR = '#0E7C86'; // teal for Dr. Okonkwo

const MAYA_AVATAR = '/assets/characters/maya.webp';
const DRO_AVATAR = '/assets/characters/dro.webp';

const BG_TITLE = '/assets/backgrounds/title.webp';
const BG_LAB = '/assets/backgrounds/lab.webp';
const BG_CELL = '/assets/backgrounds/cell.webp';
const BG_TRACK = '/assets/backgrounds/track.webp';
const BG_END = '/assets/backgrounds/end.webp';

// Map a translation key to its ElevenLabs voice file:
// 'scenes.s2.d1' -> '/assets/audio/s2_d1.mp3'
const aud = (key: string) => `/assets/audio/${key.replace(/^scenes\./, '').replace(/\./g, '_')}.mp3`;

// Helper: a Maya line in a one-at-a-time scene
const maya = (key: string) => ({
  isPrimaryHeading: true,
  heading: 'scenes.common.maya',
  headingColor: MAYA_COLOR,
  bodyAsHtml: key,
  audioUrl: aud(key),
  position: { top: '50%', left: '63%' },
  avatar: { src: MAYA_AVATAR, alt: 'scenes.common.maya_description', size: 'large' as const, position: 'left' as const },
  width: '56vw',
});

// Helper: a Dr. Okonkwo line in a one-at-a-time scene
const dro = (key: string) => ({
  isPrimaryHeading: true,
  heading: 'scenes.common.dro',
  headingColor: DRO_COLOR,
  bodyAsHtml: key,
  audioUrl: aud(key),
  position: { top: '50%', left: '38%' },
  avatar: { src: DRO_AVATAR, alt: 'scenes.common.dro_description', size: 'large' as const, position: 'right' as const },
  width: '56vw',
});

// Helper: a Dr. Okonkwo chat line on the right of a split-screen interactive scene
const droChat = (key: string) => ({
  side: 'right' as const,
  heading: 'scenes.common.dro',
  headingColor: DRO_COLOR,
  bodyAsHtml: key,
  audioUrl: aud(key),
  avatar: {
    src: DRO_AVATAR,
    alt: 'scenes.common.dro_description',
    size: 'chat-bubble' as const,
    background: '#BFE6EA',
  },
});

// Helper: a Mei chat line on the right of a split-screen interactive scene
const mayaChat = (key: string) => ({
  side: 'right' as const,
  heading: 'scenes.common.maya',
  headingColor: MAYA_COLOR,
  bodyAsHtml: key,
  audioUrl: aud(key),
  avatar: {
    src: MAYA_AVATAR,
    alt: 'scenes.common.maya_description',
    size: 'chat-bubble' as const,
    background: '#FBD9C0',
  },
});

// Helper: the persistent left interactive panel for a split-screen scene
const leftInteractive = (titleKey: string, name: string, config: string) => ({
  side: 'left' as const,
  skipNavigation: true,
  isPrimaryHeading: true,
  heading: titleKey,
  headingColor: '#333',
  position: { left: '24%', bottom: '6%' },
  interactions: [{ name, config, enableStateExchange: true }],
});

// Helper: a radio "Check Your Understanding" scene
const check = (sceneName: string, bg: string, qKey: string, config: string): SceneData => ({
  name: sceneName,
  background: { url: bg, waitDelay: SCENE_CHANGE_DELAY, blur: 6, zoom: 1.03 },
  type: 'one-at-a-time',
  dialogs: [
    {
      isPrimaryHeading: true,
      heading: `${qKey}.heading`,
      headingColor: '#333',
      bodyAsHtml: `${qKey}.stem`,
      audioUrl: aud(`${qKey}.stem`),
      position: { top: '50%', left: '50%' },
      width: '74vw',
      controls: [{ type: 'back', text: 'dialog.button.back' }, { type: 'submit', text: 'dialog.button.submit' }],
      interactions: [{ name: 'interactive-radio', config }],
    },
  ],
});

// Helper: a split-screen interactive scene
// A chat entry can be a plain Dr. Vega line (string), a Mei line ({ mei }), or
// either speaker with a per-step `gate`: the named gate-config keeps Next
// disabled until the student fulfils that bubble's command in the interactive.
type ChatEntry = string | { mei: string; gate?: string } | { dro: string; gate?: string };

const gateEvent = (name: string, configName: string) => ({
  payload: { target: name, disabled: configName },
  triggers: ['on-next'] as const,
});

const interactiveScene = (
  sceneName: string,
  bg: string,
  titleKey: string,
  name: string,
  config: string,
  chat: ChatEntry[],
): SceneData => {
  let lastHasGate = false;
  const chatDialogs = chat.map((c, i) => {
    let d = typeof c === 'string' ? droChat(c) : 'mei' in c ? mayaChat(c.mei) : droChat(c.dro);
    const gate = typeof c === 'object' && 'gate' in c ? c.gate : undefined;
    if (gate) {
      d = { ...d, events: [gateEvent(name, gate)] };
      if (i === chat.length - 1) lastHasGate = true;
    }
    return d;
  });
  // Fallback overall gate on the last bubble (must have engaged with the
  // interactive at all) — unless that bubble already carries a per-step gate.
  if (chatDialogs.length > 0 && !lastHasGate) {
    const last = chatDialogs.length - 1;
    chatDialogs[last] = {
      ...chatDialogs[last],
      events: [gateEvent(name, `gate-${name}`)],
    } as (typeof chatDialogs)[number];
  }
  return {
    name: sceneName,
    background: { url: bg, waitDelay: SCENE_CHANGE_DELAY, blur: 10, zoom: 1.08 },
    type: 'split-screen-chat',
    leftConfig: { blur: 0, background: 'rgba(255,255,255,0.94)' },
    dialogs: [leftInteractive(titleKey, name, config), ...chatDialogs],
  };
};

export const sceneData: SceneData[] = [
  // ============ SCENE 1: Title ============
  {
    name: 'scenesList.scene_1',
    background: { alt: 'scenes.common.bg_cell_description', url: BG_TITLE, waitDelay: SCENE_CHANGE_DELAY, initialZoom: 1.05 },
    logoTheme: { landscape: LogoTheme.LIGHT, portrait: LogoTheme.LIGHT },
    type: 'one-at-a-time',
    dialogs: [
      {
        heading: 'start.title',
        body: 'start.description',
        headingColor: '#ffffff',
        disableAnimation: true,
        position: { left: DialogPosition.START_SCREEN_LEFT, top: DialogPosition.START_SCREEN_TOP },
        width: DialogWidth.START_SCREEN,
        avatar: { src: MAYA_AVATAR, alt: 'scenes.common.maya_description', size: 'chat-bubble-square', background: '#E0552B' },
        controls: [{ type: 'start', text: 'start.start_game' }],
        background: { blur: 6, zoom: 1.08 },
      },
    ],
  },

  // ============ SCENE 2: The Plateau ============
  {
    name: 'scenesList.scene_2',
    background: { alt: 'scenes.common.bg_lab_description', url: BG_LAB, waitDelay: SCENE_CHANGE_DELAY, blur: 6, zoom: 1.04 },
    type: 'one-at-a-time',
    dialogs: [maya('scenes.s2.d1'), dro('scenes.s2.d2'), maya('scenes.s2.d3'), dro('scenes.s2.d4')],
  },

  // ============ SCENE 3: Meet the Mitochondrion (interactive) ============
  interactiveScene('scenesList.scene_3', BG_CELL, 'scenes.ui.explorer', 'mitochondrion-explorer', 'mitochondrion-explorer', [
    'scenes.s3.d1',
    { dro: 'scenes.s3.d2', gate: 'gate-mitochondrion-explorer-cristae' }, // "Notice the cristae" → tap them
    'scenes.s3.d3',
    'scenes.s3.d4',
    { mei: 'scenes.s3.m1' },
  ]),

  // ============ SCENE 4: Check — The Folds ============
  check('scenesList.scene_4', BG_CELL, 'scenes.q4', 'q4-cristae'),

  // ============ SCENE 4b: Check — How Many (scale) ============
  check('scenesList.scene_4b', BG_CELL, 'scenes.qscale', 'q-scale'),

  // ============ SCENE 5: Fuel and Air (interactive) ============
  interactiveScene('scenesList.scene_5', BG_CELL, 'scenes.ui.respiration', 'respiration-builder', 'respiration-builder', [
    'scenes.s5.d1',
    'scenes.s5.d2',
    'scenes.s5.d3',
  ]),

  // ============ SCENE 6: The Molecular Turbine (STAR interactive) ============
  interactiveScene('scenesList.scene_6', BG_CELL, 'scenes.ui.turbine', 'atp-synthase', 'atp-synthase', [
    'scenes.s6.d1',
    { mei: 'scenes.s6.m1' },
    { dro: 'scenes.s6.d2', gate: 'gate-atp-synthase-pumped' }, // "pumps protons" → pump them
    'scenes.s6.d3',
    { dro: 'scenes.s6.d4', gate: 'gate-atp-synthase-oxygenCut' }, // "Now cut the oxygen" → toggle it off
  ]),

  // ============ SCENE 7: Check — The Turbine ============
  check('scenesList.scene_7', BG_CELL, 'scenes.q7', 'q7-turbine'),

  // ============ SCENE 8: Why You Gasp (interactive) ============
  interactiveScene('scenesList.scene_8', BG_LAB, 'scenes.ui.sprint', 'sprint-intensity', 'sprint-intensity', [
    'scenes.s8.d1',
    'scenes.s8.d2',
    { mei: 'scenes.s8.d3' },
  ]),

  // ============ SCENE 9: Check — The Burn ============
  check('scenesList.scene_9', BG_LAB, 'scenes.q9', 'q9-burn'),

  // ============ SCENE 10: VO2max High Score ============
  {
    name: 'scenesList.scene_10',
    background: { alt: 'scenes.common.bg_lab_description', url: BG_LAB, waitDelay: SCENE_CHANGE_DELAY, blur: 6, zoom: 1.04 },
    type: 'one-at-a-time',
    dialogs: [dro('scenes.s10.d1'), dro('scenes.s10.d2'), dro('scenes.s10.d3')],
  },

  // ============ SCENE 11: The VO2max Lab (interactive) ============
  interactiveScene('scenesList.scene_11', BG_LAB, 'scenes.ui.vo2', 'vo2max-lab', 'vo2max-lab', [
    'scenes.s11.d1',
    { dro: 'scenes.s11.d2', gate: 'gate-vo2max-lab-plateau' }, // "see it flatten — that's VO2max" → reach plateau
    { dro: 'scenes.s11.d3', gate: 'gate-vo2max-lab-toolTapped' }, // "Tap the lab tools" → tap one
  ]),

  // ============ SCENE 12: Check — VO2max ============
  check('scenesList.scene_12', BG_LAB, 'scenes.q12', 'q12-vo2max'),

  // ============ SCENE 13: Building More Engines ============
  {
    name: 'scenesList.scene_13',
    background: { alt: 'scenes.common.bg_lab_description', url: BG_LAB, waitDelay: SCENE_CHANGE_DELAY, blur: 6, zoom: 1.04 },
    type: 'one-at-a-time',
    dialogs: [dro('scenes.s13.d1'), dro('scenes.s13.d2'), maya('scenes.s13.m1'), dro('scenes.s13.d3')],
  },

  // ============ SCENE 14: Choose Your Training (interactive) ============
  interactiveScene('scenesList.scene_14', BG_LAB, 'scenes.ui.training', 'training-sim', 'training-sim', [
    'scenes.s14.d1',
    'scenes.s14.d2',
    'scenes.s14.d3',
    { mei: 'scenes.s14.m1' },
  ]),

  // ============ SCENE 15: Check — Training ============
  check('scenesList.scene_15', BG_LAB, 'scenes.q15', 'q15-training'),

  // ============ SCENE 15b: Check — What's Real (evidence vs hype) ============
  check('scenesList.scene_15b', BG_LAB, 'scenes.qhype', 'q-hype'),

  // ============ SCENE 16: Running Hot (interactive) ============
  interactiveScene('scenesList.scene_16', BG_CELL, 'scenes.ui.brownfat', 'brown-fat', 'brown-fat', [
    'scenes.s16.d1',
    'scenes.s16.d2',
    { dro: 'scenes.s16.d3', gate: 'gate-brown-fat-heat' }, // "Slide between make energy and make heat" → slide to heat
    { mei: 'scenes.s16.m1' },
  ]),

  // ============ SCENE 17: Check — Heat ============
  check('scenesList.scene_17', BG_CELL, 'scenes.q17', 'q17-heat'),

  // ============ SCENE 18: Inherited From Mom (interactive) ============
  interactiveScene('scenesList.scene_18', BG_CELL, 'scenes.ui.maternal', 'maternal-line', 'maternal-line', [
    'scenes.s18.d1',
    'scenes.s18.d2',
    { mei: 'scenes.s18.m1' },
    'scenes.s18.d3',
    'scenes.s18.d4',
  ]),

  // ============ SCENE 19: Check — Inheritance ============
  check('scenesList.scene_19', BG_CELL, 'scenes.q19', 'q19-inheritance'),

  // ============ SCENE 20: Ancient Stowaways (interactive) ============
  interactiveScene('scenesList.scene_20', BG_CELL, 'scenes.ui.endo', 'endosymbiosis', 'endosymbiosis', [
    'scenes.s20.d1',
    'scenes.s20.d2',
    { mei: 'scenes.s20.m1' },
    'scenes.s20.d3',
    'scenes.s20.d4',
  ]),

  // ============ SCENE 21: Check — Endosymbiosis ============
  check('scenesList.scene_21', BG_CELL, 'scenes.q21', 'q21-endosymbiosis'),

  // ============ SCENE 22: The Commute (interactive) ============
  interactiveScene('scenesList.scene_22', BG_CELL, 'scenes.ui.axon', 'axonal-transport', 'axonal-transport', [
    'scenes.s22.d1',
    'scenes.s22.d2',
    'scenes.s22.d3',
    'scenes.s22.d4',
  ]),

  // ============ SCENE 23: Check — Neurons ============
  check('scenesList.scene_23', BG_CELL, 'scenes.q23', 'q23-neurons'),

  // ============ SCENE 24: Putting It Together ============
  {
    name: 'scenesList.scene_24',
    background: { alt: 'scenes.common.bg_track_description', url: BG_TRACK, waitDelay: SCENE_CHANGE_DELAY, blur: 6, zoom: 1.04 },
    type: 'one-at-a-time',
    dialogs: [dro('scenes.s24.d1'), maya('scenes.s24.d2'), dro('scenes.s24.d3')],
  },

  // ============ SCENE 25: Race Day ============
  {
    name: 'scenesList.scene_25',
    background: { alt: 'scenes.common.bg_track_description', url: BG_TRACK, waitDelay: SCENE_CHANGE_DELAY, blur: 6, zoom: 1.04 },
    type: 'one-at-a-time',
    dialogs: [
      { isPrimaryHeading: true, heading: 'scenes.common.dro', headingColor: DRO_COLOR, bodyAsHtml: 'scenes.s25.d1', position: { top: '50%', left: '50%' }, width: '64vw' },
      { isPrimaryHeading: true, heading: 'scenes.common.dro', headingColor: DRO_COLOR, bodyAsHtml: 'scenes.s25.d2', position: { top: '50%', left: '50%' }, width: '64vw' },
    ],
  },

  // ============ SCENE 26: End Screen ============
  {
    name: 'scenesList.scene_26',
    background: { alt: 'scenes.common.bg_track_description', url: BG_END, waitDelay: SCENE_CHANGE_DELAY, blur: 10, zoom: 1.06 },
    type: 'end-screen',
    showConfetti: true,
    dialogs: [
      {
        heading: 'scenes.s26.heading',
        bodyAsHtml: 'scenes.s26.body',
        headingColor: '#ffffff',
        disableAnimation: true,
        position: { left: '50%', top: '50%' },
        width: '78vw',
        avatar: { src: MAYA_AVATAR, alt: 'scenes.common.maya_description', size: 'chat-bubble-square', background: '#E0552B' },
        controls: [{ type: 'back', text: 'dialog.button.back' }, { type: 'start', text: 'dialog.button.start_again' }],
        background: { blur: 10, zoom: 1.06 },
      },
    ],
  },
];
