export const MODE = {
  MULTIPLAYER: 'MULTIPLAYER',
  SINGLEPLAYER: 'SINGLEPLAYER',
};

export const STATE = {
  PRELOADER: 'PRELOADER',
  MODE_SELECTION: 'MODE_SELECTION',
  ROOM_URL_DISPLAY: 'ROOM_URL_DISPLAY',
  PLAYING: 'PLAYING',
  GAME_OVER: 'GAME_OVER',
  COUNTDOWN: 'COUNTDOWN',
  PAUSED: 'PAUSED',
};

export const EVENT = {
  OPPONENT_CONNECTED: 'OPPONENT_CONNECTED',
  OPPONENT_DISCONNECTED: 'OPPONENT_DISCONNECTED',
  PRESET_CHANGED: 'PRESET_CHANGED',
  GAME_OVER: 'GAME_OVER',
  RESTART_GAME: 'RESTART_GAME',
};

export const ACTION = {
  MOVE: 'M',
  HIT: 'H',
  MISS: 'I',
  PRESETCHANGE: 'P',
  PING: 'A',
  PONG: 'I',
  RESTART_GAME: 'R',
};

export const PRESET = {
  INSANE: 'Insane Mode',
  NORMAL: 'Normal Mode',
  PINGPONG: 'Ping Pong',
};

export const INITIAL_CONFIG = {
  mode: MODE.SINGLEPLAYER,
  preset: PRESET.NORMAL,
  gravity: 0,
  netThickness: 0.02,
  boxWidth: 3,
  boxDepth: 5,
  boxHeight: 2,
  netHeight: 0.3,
  boxPositionZ: -3.5,
  boxWallThickness: 0.05,
  paddleThickness: 0.04,
  paddleSize: 0.5,
  get paddlePositionZ() {
    return this.boxPositionZ
      + this.boxDepth / 2
      + this.boxWallThickness / 2
      + this.paddleThickness / 2;
  },
  ballRadius: 0.03,
  ballMass: 0.001,
  ballPaddleFriction: 0.8,
  ballPaddleBounciness: 1,
  ballBoxBounciness: 0.95,
  ballInitVelocity: 1,
  paddleModel: 'box',
  cameraHeight: 1,
  preset: PRESET.NORMAL,
  insaneBallInterval: 3000,

  POINTS_FOR_WIN: 11,
  ROOM_CODE_LENGTH: 4,

  colors: {
    BLACK: 0x000000,
    WHITE: 0xFFFFFF,
    PADDLE_COLOR_PINGPONG: 0xE35C27,
    OPPONENT_PADDLE_COLOR_PINGPONG: 0x786EF2,
    PADDLE_COLOR_INSANE: 0xfff834,
    OPPONNENT_PADDLE_COLOR_INSANE: 0x96ffbc,
    INSANE: [
      0x22538f,
      0xff9ba3,
      0x00ceda,
      0xc56e62,
      0x2c7b58,
      0xe25c27,
    ]
  },
};
