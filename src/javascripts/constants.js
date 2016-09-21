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
  boxDepth: 5,
  boxHeight: 2,
  boxPositionZ: -3.5,
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
  cameraHeight: 1,

  ROOM_CODE_LENGTH: 6,

  colors: {
    BLACK: 0x000000,
    WHITE: 0xFFFFFF,
  },
};
