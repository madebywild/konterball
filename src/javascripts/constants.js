export const MODE = {
  MULTIPLAYER: 'MULTIPLAYER',
  SINGLEPLAYER: 'SINGLEPLAYER',
};

export const ACTION = {
  MOVE: 'M',
  HIT: 'H',
  MISS: 'I',
};

export const PRESET_NAMES = {
  GRAVITY: 'Gravity',
  HUGE_BALLS: 'Huge Balls',
  CRAZY: 'Crazy',
  TENNIS: 'Tennis',
  STANDARD: 'Standard',
  SLOWMOTION: 'Slowmotion',
};

const PRESETS = {};
PRESETS[PRESET_NAMES.GRAVITY] = {
  gravity: 4,
};
PRESETS[PRESET_NAMES.HUGE_BALLS] = {
  ballRadius: 0.1,
};
PRESETS[PRESET_NAMES.SLOWMOTION] = {
  ballInitVelocity: 0.5,
};

export {PRESETS};

export const INITIAL_CONFIG = {
  mode: MODE.SINGLEPLAYER,
  gravity: 0,
  netHeight: 0.15,
  netThickness: 0.02,
  boxWidth: 3,
  boxDepth: 10,
  boxHeight: 2,
  paddleThickness: 0.04,
  paddleSize: 0.5,
  paddlePositionZ: -1,
  ballRadius: 0.03,
  ballMass: 0.001,
  ballPaddleFriction: 0.8,
  ballPaddleBounciness: 1,
  ballBoxBounciness: 1,
  ballInitVelocity: 1,
  paddleModel: 'box',
  boxPositionZ: -2.5,
  cameraHeight: 1,

  colors: {
    BLUE: 0x124888,
    BACKGROUND: 0x000000,
    DARK_BLUE: 0x143A61,
    WHITE: 0xFFFFFF,
    YELLOW: 0xFAFD58,
    RED: 0xD31515,
    LIGHT_RED: 0xE35C27,
    PINK: 0xFD9CA3,
    PONG_PADDLE: 0x8FFFBB,
    PONG_GREEN_1: 0x064042,
    PONG_GREEN_2: 0x0E5547,
    PONG_GREEN_3: 0x1E5F4B,
    PONG_GREEN_4: 0x17714D,
    PONG_GREEN_5: 0x08484A,
    PONG_GREEN_6: 0x136853,
    PONG_GREEN_7: 0x2B7B58,
    PONG_GREEN_8: 0x23995C,
    PONG_GREEN_9: 0x23B76D,
  },
};
