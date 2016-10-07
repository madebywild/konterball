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
  GAME_OVER: 'GAME_OVER',
  RESTART_GAME: 'RESTART_GAME',
};

export const ACTION = {
  MOVE: 'M',
  HIT: 'HIT',
  MISS: 'MISS',
  PING: 'PING',
  PONG: 'PONG',
  RESTART_GAME: 'RESTART_GAME',
  REQUEST_COUNTDOWN: 'REQUEST_COUNTDOWN',
};

export const INITIAL_CONFIG = {
  mode: MODE.SINGLEPLAYER,
  gravity: 6,
  netThickness: 0.02,
  tableWidth: 1.52,
  tableDepth: 2.74,
  tableHeight: 0.762,
  netHeight: 0.15,
  tablePositionZ: -2,
  paddleThickness: 0.04,
  paddleSize: 0.5,
  get paddlePositionZ() {
    return this.tablePositionZ
      + this.tableDepth / 2
      + this.paddleThickness / 2;
  },
  ballRadius: 0.03,
  ballMass: 0.001,
  ballPaddleFriction: 0.8,
  ballPaddleBounciness: 1,
  ballBoxBounciness: 0.95,
  ballInitVelocity: 1,
  paddleModel: 'box',
  cameraHeight: 1.6,
  insaneBallInterval: 3000,

  POINTS_FOR_WIN: 11,
  ROOM_CODE_LENGTH: 4,

  colors: {
    BLUE_BACKGROUND: 0x1b5692,
    BLUE_TABLE: 0x124787,
    BLUE_HUD: 0x3376c7,
    PADDLE_COLOR: 0xd21515,
    BALL: 0xf9fc56,
  },
};
